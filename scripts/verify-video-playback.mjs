import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];

for (const viewport of [{ name:'desktop', width:1440, height:900 }, { name:'mobile', width:390, height:844 }]) {
  const page = await browser.newPage({ viewport });
  await page.goto(URL, { waitUntil:'networkidle' });

  const inspectVideo = selector => page.evaluate(sel => {
    const video = document.querySelector(sel), quality = video.getVideoPlaybackQuality();
    return {
      source:video.currentSrc,currentTime:video.currentTime,duration:video.duration,
      width:video.videoWidth,height:video.videoHeight,total:quality.totalVideoFrames,
      dropped:quality.droppedVideoFrames,corrupted:quality.corruptedVideoFrames,
      paused:video.paused,cadence:quality.totalVideoFrames / Math.max(.1,video.currentTime),
    };
  }, selector);

  const expectedCadence = viewport.name === 'mobile' ? 28.5 : 22.5;
  const validate = (label, playback, minimumTime) => {
    const expectedSize = viewport.name === 'desktop'
      ? playback.width >= 1280 && playback.height >= 720
      : playback.width >= 720 && playback.height >= 1280;
    const rightVariant = viewport.name === 'mobile' ? playback.source.includes('mobile') : playback.source.includes('desktop');
    const dropRatio = playback.total ? playback.dropped / playback.total : 1;
    if (!expectedSize || !rightVariant || playback.currentTime < minimumTime || playback.duration < 14.8 ||
        playback.cadence < expectedCadence || playback.paused || dropRatio > .01 || playback.corrupted > 0) {
      failures.push(`${viewport.name} ${label}: reproducción deficiente ${JSON.stringify({ ...playback,dropRatio })}`);
    }
  };

  const introSelector = '.intro-step [data-scene-video]';
  await page.waitForFunction(sel => document.querySelector(sel)?.currentTime > .2, introSelector, { timeout:15000 });
  await page.waitForTimeout(8000);
  const intro = await inspectVideo(introSelector);
  validate('inicio', intro, 8);
  await page.evaluate(sel => {
    const video = document.querySelector(sel);
    video.currentTime = Math.max(0, video.duration - .3);
    video.play();
  }, introSelector);
  await page.waitForFunction(sel => {
    const video = document.querySelector(sel);
    return video?.currentTime > .05 && video.currentTime < 1 && !video.paused && !video.classList.contains('soft-loop-fade');
  }, introSelector, { timeout:5000 });
  const introLoop = await page.evaluate(sel => {
    const video = document.querySelector(sel);
    return { currentTime:video.currentTime, paused:video.paused, softLoop:video.dataset.softLoopReady, faded:video.classList.contains('soft-loop-fade') };
  }, introSelector);
  if (introLoop.softLoop !== 'true' || introLoop.paused || introLoop.faded) failures.push(`${viewport.name} inicio: el loop suave no retomó ${JSON.stringify(introLoop)}`);

  const laterResults = [];
  for (const selector of ['.confirm-step [data-scene-video]', '#thanksAmbientVideo']) {
    await page.evaluate(sel => activateSceneVideo(document.querySelector(sel), true), selector);
    await page.waitForFunction(sel => document.querySelector(sel)?.currentTime > .2, selector, { timeout:15000 });
    await page.waitForTimeout(4000);
    const playback = await inspectVideo(selector);
    validate(selector, playback, 4);
    laterResults.push(`${playback.cadence.toFixed(1)}fps ${playback.dropped}/${playback.total}`);
  }

  console.log(`${viewport.name}: inicio ${intro.cadence.toFixed(1)}fps ${intro.dropped}/${intro.total}; posteriores ${laterResults.join(', ')}`);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FALLAS:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('OK: las tres escenas sostienen cadencia y variante responsive');
