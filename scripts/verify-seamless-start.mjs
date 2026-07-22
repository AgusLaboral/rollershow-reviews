import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];

for (const viewport of [{ name:'desktop', width:1440, height:900 }, { name:'mobile', width:390, height:844 }]) {
  const page = await browser.newPage({ viewport });
  let videoRequestedAt = 0;
  const navigationStartedAt = Date.now();
  await page.route('**/rs-premio-celebracion-*.mp4', async route => {
    if (!videoRequestedAt) videoRequestedAt = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto(URL, { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(450);

  const waiting = await page.evaluate(() => {
    const image = document.querySelector('.intro-base');
    const video = document.querySelector('.intro-step [data-scene-video]');
    return {
      imageTransform: getComputedStyle(image).transform,
      imageAnimation: getComputedStyle(image).animationName,
      videoOpacity: getComputedStyle(video).opacity,
      preload: video.preload,
      embeddedSources: video.querySelectorAll('source[src]').length,
    };
  });
  const requestDelay = videoRequestedAt ? videoRequestedAt - navigationStartedAt : Infinity;
  if (waiting.imageTransform !== 'none' || waiting.imageAnimation !== 'none' || waiting.videoOpacity !== '0' ||
      waiting.preload !== 'auto' || waiting.embeddedSources !== 2 || requestDelay > 500) {
    failures.push(`${viewport.name}: la espera todavía cambia de plano o pide tarde el video ${JSON.stringify({ ...waiting, requestDelay })}`);
  }

  await page.waitForFunction(() => {
    const video = document.querySelector('.intro-step [data-scene-video]');
    return video?.classList.contains('is-ready') && video.currentTime > .08;
  }, null, { timeout:15000 });
  await page.waitForTimeout(180);

  const ready = await page.evaluate(async () => {
    const image = document.querySelector('.intro-base');
    const video = document.querySelector('.intro-step [data-scene-video]');
    video.pause();
    if (video.currentTime > .01) {
      await new Promise(resolve => {
        video.addEventListener('seeked', resolve, { once:true });
        video.currentTime = 0;
      });
    }
    const width = 160;
    const height = Math.round(width * video.videoHeight / video.videoWidth);
    const imageCanvas = document.createElement('canvas');
    const videoCanvas = document.createElement('canvas');
    imageCanvas.width = videoCanvas.width = width;
    imageCanvas.height = videoCanvas.height = height;
    const imageContext = imageCanvas.getContext('2d', { willReadFrequently:true });
    const videoContext = videoCanvas.getContext('2d', { willReadFrequently:true });
    imageContext.drawImage(image, 0, 0, width, height);
    videoContext.drawImage(video, 0, 0, width, height);
    const a = imageContext.getImageData(0, 0, width, height).data;
    const b = videoContext.getImageData(0, 0, width, height).data;
    let difference = 0;
    for (let index = 0; index < a.length; index += 4) {
      difference += Math.abs(a[index] - b[index]) + Math.abs(a[index + 1] - b[index + 1]) + Math.abs(a[index + 2] - b[index + 2]);
    }
    return {
      frameDifference: difference / (width * height * 3 * 255),
      videoOpacity: getComputedStyle(video).opacity,
      transitionDuration: getComputedStyle(video).transitionDuration,
      poster: image.currentSrc,
      video: video.currentSrc,
      imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
      videoSize: `${video.videoWidth}x${video.videoHeight}`,
    };
  });
  const rightVariant = ready.poster.includes(viewport.name) && ready.video.includes(viewport.name);
  if (!rightVariant || ready.videoOpacity !== '1' || ready.transitionDuration !== '0.16s' || ready.frameDifference > .025 || ready.imageSize !== ready.videoSize) {
    failures.push(`${viewport.name}: poster y cuadro cero no empalman ${JSON.stringify(ready)}`);
  }
  console.log(`${viewport.name}: pedido a ${requestDelay} ms, diferencia de cuadro ${(ready.frameDifference * 100).toFixed(2)}%`);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FALLAS:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('OK: carga anticipada y empalme inmóvil entre poster y video verificados');
