// Evita que rutas descartadas vuelvan a descargar imágenes o inflar el arranque mobile.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:1 });
const page = await context.newPage();
await page.goto(URL, { waitUntil:'networkidle' });
const report = await page.evaluate(() => {
  const resources = performance.getEntriesByType('resource');
  const images = resources.filter(entry => entry.initiatorType === 'img');
  const videos = resources.filter(entry => /\/img\/video\/.*\.mp4(?:$|\?)/.test(entry.name));
  const names = images.map(entry => new URL(entry.name).pathname.split('/').at(-1));
  const totalBytes = resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
  const imageBytes = images.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
  const videoBytes = videos.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
  const shellBytes = totalBytes - videoBytes;
  const originals = names.filter(name => /^(blackout|sunscreen)-.*(?<!-blurred)\.jpg$/.test(name));
  return {
    resources:resources.length,
    images:names,
    totalBytes,
    imageBytes,
    videoBytes,
    shellBytes,
    originals,
    domInteractive:performance.getEntriesByType('navigation')[0]?.domInteractive || 0,
  };
});
await context.close();
await browser.close();

const failures = [];
if (report.originals.length) failures.push(`se descargan fotos del formulario descartado: ${report.originals.join(', ')}`);
if (report.shellBytes > 850 * 1024) failures.push(`shell mobile supera 850 KB: ${Math.round(report.shellBytes / 1024)} KB`);
if (report.videoBytes > 1900 * 1024) failures.push(`video inicial mobile supera 1900 KB: ${Math.round(report.videoBytes / 1024)} KB`);
if (report.imageBytes > 400 * 1024) failures.push(`imágenes iniciales superan 400 KB: ${Math.round(report.imageBytes / 1024)} KB`);
if (failures.length) {
  console.error(failures.join('\n'));
  console.error(JSON.stringify(report));
  process.exit(1);
}
console.log(`OK: shell mobile ${Math.round(report.shellBytes / 1024)} KB + video progresivo ${Math.round(report.videoBytes / 1024)} KB; imágenes ${Math.round(report.imageBytes / 1024)} KB; sin assets del formulario descartado`);
