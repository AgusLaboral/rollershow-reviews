// Verificación geométrica del flujo multistep.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const fails = [];

for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1280, height: 800 }]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  const intro = await page.evaluate(() => {
    const step = document.querySelector('.flow-step.active');
    const button = step.querySelector('.step-primary');
    const r = button.getBoundingClientRect();
    return {
      activeSteps: document.querySelectorAll('.flow-step.active').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      ctaLeft: Math.round(r.left), ctaRight: Math.round(r.right),
      ctaTop: Math.round(r.top), ctaBottom: Math.round(r.bottom), viewportHeight: innerHeight,
      duplicateLogo: [...document.querySelectorAll('.intro-logo,.flow-logo')].filter(el => {
        const s = getComputedStyle(el); return s.opacity !== '0' && el.getClientRects().length;
      }).length,
    };
  });
  if (intro.activeSteps !== 1) fails.push(`${viewport.width}px: ${intro.activeSteps} etapas activas`);
  if (intro.overflow > 0) fails.push(`${viewport.width}px: overflow ${intro.overflow}px`);
  if (intro.ctaLeft < 0 || intro.ctaRight > viewport.width) fails.push(`${viewport.width}px: CTA fuera de pantalla`);
  if (intro.ctaTop < 0 || intro.ctaBottom > intro.viewportHeight) fails.push(`${viewport.width}px: CTA de portada debajo del pliegue`);
  if (intro.duplicateLogo !== 1) fails.push(`${viewport.width}px: ${intro.duplicateLogo} logos visibles en portada`);

  await page.click('#startFlow'); await page.waitForTimeout(600);
  const item = await page.evaluate(() => {
    const step = document.querySelector('.flow-step.active');
    const r = step.querySelector('.step-inner').getBoundingClientRect();
    return {
      kind: step.dataset.flowStep, left: Math.round(r.left), right: Math.round(r.right),
      overflow: document.documentElement.scrollWidth - innerWidth,
      verticalOverflow: step.scrollHeight - step.clientHeight,
    };
  });
  if (item.kind !== 'item-1') fails.push(`${viewport.width}px: no abrió item-1`);
  if (item.left < 0 || item.right > viewport.width) fails.push(`${viewport.width}px: contenido fuera de pantalla (${item.left}, ${item.right})`);
  if (item.overflow > 0) fails.push(`${viewport.width}px: overflow en primera cortina`);
  if (item.verticalOverflow > 4) fails.push(`${viewport.width}px: la primera decisión exige scroll (${item.verticalOverflow}px)`);
  console.log(`${viewport.width}px: intro CTA ${intro.ctaLeft}-${intro.ctaRight}, contenido ${item.left}-${item.right}, overflow 0`);
  await ctx.close();
}

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: una etapa activa, un logo, CTA y contenido contenidos, sin overflow en 320/390/768/1280');
