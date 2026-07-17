import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];

for (const viewport of [
  { name:'desktop', width:2048, height:1024, minimumCadence:22.5 },
  { name:'mobile', width:390, height:844, minimumCadence:28 },
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(URL, { waitUntil:'networkidle' });
  await page.evaluate(() => {
    document.body.classList.add('done');
    const video = document.querySelector('#thanksAmbientVideo');
    prepareSceneVideo(video);
  });
  await page.waitForFunction(() => document.querySelector('#thanksAmbientVideo')?.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA, null, { timeout:20000 });

  const result = await page.evaluate(async () => {
    const video = document.querySelector('#thanksAmbientVideo');
    activateSceneVideo(video, true);
    await new Promise(resolve => setTimeout(resolve, 600));
    startCelebration();
    const before = video.getVideoPlaybackQuality();
    const startedAt = performance.now();
    const rafTimes = [];
    const videoTimes = [];
    let raf = 0, frameCallback = 0;
    const onRaf = now => { rafTimes.push(now); raf = requestAnimationFrame(onRaf); };
    const onVideoFrame = now => { videoTimes.push(now); frameCallback = video.requestVideoFrameCallback(onVideoFrame); };
    raf = requestAnimationFrame(onRaf);
    frameCallback = video.requestVideoFrameCallback(onVideoFrame);
    await new Promise(resolve => setTimeout(resolve, 6500));
    cancelAnimationFrame(raf);
    video.cancelVideoFrameCallback(frameCallback);
    const elapsed = (performance.now() - startedAt) / 1000;
    const after = video.getVideoPlaybackQuality();
    const gaps = values => values.slice(1).map((value,index) => value-values[index]).sort((a,b) => a-b);
    const percentile = (values, ratio) => values[Math.min(values.length-1,Math.floor(values.length*ratio))] || 0;
    const rafGaps = gaps(rafTimes), videoGaps = gaps(videoTimes);
    return {
      elapsed,
      cadence:(after.totalVideoFrames-before.totalVideoFrames)/elapsed,
      dropped:after.droppedVideoFrames-before.droppedVideoFrames,
      total:after.totalVideoFrames-before.totalVideoFrames,
      rafP95:percentile(rafGaps,.95),
      rafMax:rafGaps.at(-1) || 0,
      videoP95:percentile(videoGaps,.95),
      videoMax:videoGaps.at(-1) || 0,
      celebration:window.__celebrationState || null,
    };
  });
  const dropRatio = result.total ? result.dropped/result.total : 1;
  if (result.cadence < viewport.minimumCadence || dropRatio > .10 || result.videoMax > 150 || result.rafP95 > 55) {
    failures.push(`${viewport.name}: cierre choppy ${JSON.stringify({ ...result,dropRatio })}`);
  }
  console.log(`${viewport.name}: ${result.cadence.toFixed(1)}fps, drops ${result.dropped}/${result.total}, video gap p95/max ${result.videoP95.toFixed(0)}/${result.videoMax.toFixed(0)}ms, RAF p95/max ${result.rafP95.toFixed(0)}/${result.rafMax.toFixed(0)}ms`);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(`FALLAS:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('OK: video, cortinas y celebración final sostienen fluidez juntos');
