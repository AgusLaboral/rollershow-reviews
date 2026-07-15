// Auditoría de alineación real (getBoundingClientRect), no capturas a ojo.
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();

for (const w of [1280, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const rects = await page.evaluate(() => {
    const sel = {
      hero_h1: '.hero h1',
      ganador_card: '.ganador-card',
      chancebar_content: '.chance-count',
      item_card: '#items .item',
      experiencia_panel: '.experiencia',
      consent_row: '.consent',
      cta_button: '.cta',
    };
    const out = {};
    for (const [k, s] of Object.entries(sel)) {
      const el = document.querySelector(s);
      if (!el) { out[k] = null; continue; }
      const r = el.getBoundingClientRect();
      out[k] = { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    }
    return out;
  });

  console.log(`\n--- viewport ${w}px ---`);
  const lefts = new Set();
  for (const [k, r] of Object.entries(rects)) {
    console.log(k.padEnd(12), r ? `left=${r.left} right=${r.right} width=${r.width}` : 'NOT FOUND');
    if (r) lefts.add(r.left);
  }
  if (lefts.size > 1) console.log(`  ⚠ bordes izquierdos distintos: ${[...lefts].join(', ')}`);
  else console.log(`  ✓ todos comparten el mismo borde izquierdo (${[...lefts][0]}px)`);

  await ctx.close();
}
await browser.close();
