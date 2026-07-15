import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const OUT = 'C:/Users/Agus/Desktop/rollershow-reviews/_scratch';
const browser = await chromium.launch();
for (const w of [1280, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/desk-${w}-fold.png` });
  await ctx.close();
}
await browser.close();
console.log('desktop screenshots done');
