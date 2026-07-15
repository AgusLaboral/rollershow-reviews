// Verificación del mockup rollershow-reviews (mobile-first)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const OUT = 'C:/Users/Agus/Desktop/rollershow-reviews/_scratch';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const fails = [];

for (const vp of [{ w: 360, h: 780 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    permissions: [],
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // 1. overflow horizontal
  const over = await page.evaluate(() => ({
    scrollLeft: document.body.scrollLeft + document.documentElement.scrollLeft,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (over.scrollLeft !== 0 || over.overflow > 0) fails.push(`${vp.w}px: overflow horizontal ${JSON.stringify(over)}`);

  await page.screenshot({ path: `${OUT}/v-${vp.w}-fold.png` });
  await page.screenshot({ path: `${OUT}/v-${vp.w}-full.png`, fullPage: true });

  if (vp.w === 390) {
    // 2. estrellas -> +5
    await page.locator('#stars button').nth(4).click();
    let pts = await page.textContent('#ptsNum');
    if (pts !== '5') fails.push(`estrellas: esperaba 5 pts, hay ${pts}`);

    // 3. foto -> +10 (total 15)
    await page.locator('.item input[type=file]').first().setInputFiles({
      name: 'foto.jpg', mimeType: 'image/jpeg',
      buffer: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64'),
    });
    await page.waitForTimeout(400);
    pts = await page.textContent('#ptsNum');
    if (pts !== '15') fails.push(`foto: esperaba 15 pts, hay ${pts}`);
    const tickets = await page.textContent('#ticketNum');
    if (tickets !== '1') fails.push(`tickets: esperaba 1, hay ${tickets}`);

    // 4. texto >= 20 chars -> +5 (total 20)
    await page.fill('#reviewText', 'Excelente atencion, quedaron hermosas las cortinas del living.');
    pts = await page.textContent('#ptsNum');
    if (pts !== '20') fails.push(`texto: esperaba 20 pts, hay ${pts}`);

    // 5. submit sin consentimiento -> NO pasa
    await page.click('#submitBtn');
    await page.waitForTimeout(300);
    if (await page.evaluate(() => document.body.classList.contains('done'))) fails.push('submit paso sin consentimiento');

    // 6. consentimiento + submit -> gracias
    await page.check('#consent');
    await page.click('#submitBtn');
    await page.waitForTimeout(1300);
    if (!(await page.evaluate(() => document.body.classList.contains('done')))) fails.push('no llego a gracias');
    const grPts = await page.textContent('#grPts');
    if (grPts !== '20') fails.push(`gracias: esperaba 20 pts, hay ${grPts}`);
    await page.screenshot({ path: `${OUT}/v-390-gracias.png`, fullPage: true });

    // 6b. duplicar con reseña de Google: click abre pestaña nueva + revela confirmar
    const [popup] = await Promise.all([
      ctx.waitForEvent('page'),
      page.click('#gReviewBtn'),
    ]);
    await popup.close().catch(() => {});
    await page.waitForTimeout(200);
    const confirmVisible = await page.isVisible('#gConfirmStep');
    if (!confirmVisible) fails.push('gReviewBtn no revela el paso de confirmar');
    await page.click('#gConfirmBtn');
    await page.waitForTimeout(300);
    const validatingVisible = await page.isVisible('#gValidating');
    if (!validatingVisible) fails.push('no se muestra el estado "confirmando"');
    await page.waitForTimeout(2900); // 1700ms de "validando" + 900ms de count-up + margen
    const doneVisible = await page.isVisible('#gDone');
    if (!doneVisible) fails.push('no se muestra el estado "listo" tras confirmar');
    const grPtsAfter = await page.textContent('#grPts');
    if (grPtsAfter !== '40') fails.push(`google review: esperaba 40 pts (doble de 20), hay ${grPtsAfter}`);
    const grTicketsAfter = await page.textContent('#grTickets');
    if (grTicketsAfter !== '4') fails.push(`google review: esperaba 4 chances, hay ${grTicketsAfter}`);
    await page.screenshot({ path: `${OUT}/v-390-google-done.png`, fullPage: true });

    // 7. exit popup: back-trap en pagina nueva con puntos
    const p2 = await ctx.newPage();
    await p2.goto(URL, { waitUntil: 'networkidle' });
    await p2.locator('#stars button').nth(3).click();
    await p2.goBack();
    await p2.waitForTimeout(500);
    const exitOpen = await p2.evaluate(() => document.getElementById('exitModal').open);
    if (!exitOpen) fails.push('exit popup no aparecio con botón Atrás');
    else await p2.screenshot({ path: `${OUT}/v-390-exit.png` });

    // 8. modal bases
    const p3 = await ctx.newPage();
    await p3.goto(URL, { waitUntil: 'networkidle' });
    await p3.click('#openBases');
    if (!(await p3.evaluate(() => document.getElementById('basesModal').open))) fails.push('modal bases no abre');
  }
  await ctx.close();
}

// desktop rápido
const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dpage = await dctx.newPage();
await dpage.goto(URL, { waitUntil: 'networkidle' });
await dpage.waitForTimeout(1000);
await dpage.screenshot({ path: `${OUT}/v-1280-fold.png` });
await dctx.close();

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: overflow 0, puntos 5/15/20, consentimiento bloquea, gracias 20pts, exit popup Atrás, bases OK');
