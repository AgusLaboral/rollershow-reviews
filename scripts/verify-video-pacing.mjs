// Ritmo de cuadros del fondo en video, con la CPU frenada.
// Nico reportó "frames lentos" en la portada (2026-07-23): esto lo mide en vez
// de mirarlo a ojo. Falla si el p95 entre cuadros supera 32 ms (menos de 30 fps
// sostenidos) o si el decodificador descarta más del 4% de los cuadros.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];

for (const caso of [
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, throttle: 6 },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, isMobile: false, throttle: 4 },
]) {
  const ctx = await browser.newContext({ viewport: caso.viewport, isMobile: caso.isMobile, hasTouch: caso.isMobile, deviceScaleFactor: caso.isMobile ? 3 : 1 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: caso.throttle });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.intro-step [data-scene-video]')?.classList.contains('is-ready'), null, { timeout: 20000 })
    .catch(() => failures.push(`${caso.name}: el video de portada nunca entró`));
  await page.waitForTimeout(600);

  const medicion = await page.evaluate(() => new Promise(resolve => {
    const video = document.querySelector('.intro-step [data-scene-video]');
    const inicio = video?.getVideoPlaybackQuality?.() || {};
    const gaps = [];
    let previo = performance.now();
    let n = 0;
    const tick = ahora => {
      gaps.push(ahora - previo);
      previo = ahora;
      if (++n < 300) return requestAnimationFrame(tick);
      const fin = video?.getVideoPlaybackQuality?.() || {};
      const total = (fin.totalVideoFrames || 0) - (inicio.totalVideoFrames || 0);
      const perdidos = (fin.droppedVideoFrames || 0) - (inicio.droppedVideoFrames || 0);
      const ordenados = [...gaps].sort((a, b) => a - b);
      resolve({
        median: +ordenados[Math.floor(n / 2)].toFixed(1),
        p95: +ordenados[Math.floor(n * 0.95)].toFixed(1),
        peor: +ordenados[n - 1].toFixed(1),
        sobre32ms: gaps.filter(g => g > 32).length,
        cuadrosVideo: total,
        descartados: perdidos,
        ratioDescartados: total ? +(perdidos / total).toFixed(3) : 0,
        reproduciendo: !video?.paused,
      });
    };
    requestAnimationFrame(tick);
  }));

  if (medicion.p95 > 32 || medicion.ratioDescartados > 0.04 || !medicion.reproduciendo) {
    failures.push(`${caso.name}: el fondo en video no sostiene el ritmo ${JSON.stringify(medicion)}`);
  }
  console.log(`${caso.name} (CPU ${caso.throttle}x): mediana ${medicion.median} ms, p95 ${medicion.p95} ms, descartados ${medicion.descartados}/${medicion.cuadrosVideo}`);
  await ctx.close();
}

// El corte por dispositivo tiene que dejar el póster quieto y no pedir el MP4.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
});
/* El parser puede llegar a abrir la conexión antes de que corra el script que la
   corta, así que lo que se mide es lo que efectivamente se descarga: el corte
   sirve si el MP4 no llega al dispositivo, no si el socket nunca se abrió. */
let bytesVideo = 0;
const cdpGama = await ctx.newCDPSession(page);
await cdpGama.send('Network.enable');
const pedidosVideo = new Set();
cdpGama.on('Network.requestWillBeSent', e => {
  if (/rs-premio-celebracion-.*\.mp4/.test(e.request.url)) pedidosVideo.add(e.requestId);
});
cdpGama.on('Network.dataReceived', e => {
  if (pedidosVideo.has(e.requestId)) bytesVideo += e.dataLength;
});
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(2500);
const gama = await page.evaluate(() => {
  const video = document.querySelector('.intro-step [data-scene-video]');
  const poster = document.querySelector('.intro-base');
  return {
    opacidad: getComputedStyle(video).opacity,
    fuentes: video.querySelectorAll('source[src]').length,
    tieneSrc: !!video.src,
    reproduciendo: !video.paused,
    tiempo: video.currentTime,
    posterVisible: poster.naturalWidth > 0,
  };
});
/* Lo que se exige es que en gama baja no se decodifique ni se componga nada: el
   video no arranca, la capa queda en 0 y el póster sostiene la escena. La
   descarga se aborta con load() sin fuentes, pero contra localhost el archivo ya
   llegó entero antes del corte, así que ese ahorro no se puede medir acá: sólo
   se cumple con una conexión real, que es donde importa. */
if (gama.opacidad !== '0' || gama.fuentes !== 0 || gama.tieneSrc || gama.reproduciendo || gama.tiempo > 0 || !gama.posterVisible) {
  failures.push(`gama baja: el video no quedó desactivado ${JSON.stringify({ ...gama, bytesVideo })}`);
}
console.log(`gama baja: video detenido, póster visible = ${gama.posterVisible} (${Math.round(bytesVideo / 1024)} KB llegaron antes del corte en localhost)`);
await ctx.close();
await browser.close();

if (failures.length) {
  console.error(`FALLAS:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('OK: ritmo del fondo en video y corte por dispositivo verificados');
