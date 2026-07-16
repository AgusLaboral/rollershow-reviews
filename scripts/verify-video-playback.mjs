import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];

for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.intro-step [data-scene-video]')?.currentTime > .2, null, { timeout: 15000 });
  await page.waitForTimeout(8000);
  const playback = await page.evaluate(() => {
    const video = document.querySelector('.intro-step [data-scene-video]');
    const quality = video.getVideoPlaybackQuality();
    return {
      source: video.currentSrc,
      currentTime: video.currentTime,
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      total: quality.totalVideoFrames,
      dropped: quality.droppedVideoFrames,
      corrupted: quality.corruptedVideoFrames,
    };
  });
  const expectedSize = viewport.name === 'desktop'
    ? playback.width >= 1280 && playback.height >= 720
    : playback.width >= 720 && playback.height >= 1280;
  const dropRatio = playback.total ? playback.dropped / playback.total : 1;
  if (!expectedSize || playback.currentTime < 8 || playback.duration < 14.8 || dropRatio > .01 || playback.corrupted > 0) {
    failures.push(`${viewport.name}: reproducción deficiente ${JSON.stringify({ ...playback, dropRatio })}`);
  }
  console.log(`${viewport.name}: ${playback.width}x${playback.height}, ${playback.dropped}/${playback.total} cuadros perdidos`);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FALLAS:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('OK: fondos cinematográficos fluidos en desktop y mobile');
