// Verificación funcional del flujo multistep Rollershow Reviews.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const OUT = 'C:/Users/Agus/Desktop/rollershow-reviews/_scratch';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const fails = [];
const waitCurtain = page => page.waitForTimeout(950);
const testImage = {
  name: 'foto.jpg', mimeType: 'image/jpeg',
  buffer: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64'),
};

async function reachConfirm(page, { withPhoto = false } = {}) {
  await page.click('#startFlow'); await waitCurtain(page);
  if (withPhoto) {
    await page.locator('.flow-step.active input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(300);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }
  } else {
    for (let i = 0; i < 4; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }
  }
  await page.locator('#stars button').nth(4).click();
  await page.click('#ratingNext'); await waitCurtain(page);
  await page.click('.audio-step.active [data-flow-next]'); await waitCurtain(page);
  await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
  await page.click('.text-step.active .step-primary'); await waitCurtain(page);
}

for (const vp of [{ w: 360, h: 780 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    permissions: [],
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const initial = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    active: document.querySelector('.flow-step.active')?.dataset.flowStep,
    primaries: document.querySelectorAll('.intro-step.active .step-primary').length,
    prizes: document.body.innerText.includes('3 almohadones y 2 alfombras premium'),
  }));
  if (initial.overflow > 0) fails.push(`${vp.w}px: overflow horizontal ${initial.overflow}`);
  if (initial.active !== 'intro') fails.push(`${vp.w}px: la portada no es el primer paso`);
  if (initial.primaries !== 1) fails.push(`${vp.w}px: la portada tiene ${initial.primaries} CTAs primarios`);
  if (!initial.prizes) fails.push(`${vp.w}px: faltan los premios concretos`);
  await page.screenshot({ path: `${OUT}/canonical-${vp.w}-intro.png` });

  if (vp.w === 390) {
    await page.click('#startFlow'); await waitCurtain(page);
    if (await page.getAttribute('.flow-step.active', 'data-flow-step') !== 'item-1') fails.push('el CTA no abre la primera cortina');
    await page.screenshot({ path: `${OUT}/canonical-390-item.png` });

    await page.locator('.flow-step.active input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(300);
    let pts = await page.textContent('#flowPts');
    if (pts !== '10') fails.push(`foto: esperaba 10 puntos, hay ${pts}`);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }

    await page.locator('#stars button').nth(4).click();
    pts = await page.textContent('#flowPts');
    if (pts !== '15') fails.push(`estrellas: esperaba 15 puntos, hay ${pts}`);
    await page.click('#ratingNext'); await waitCurtain(page);
    await page.click('.audio-step.active [data-flow-next]'); await waitCurtain(page);
    await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
    pts = await page.textContent('#flowPts');
    if (pts !== '20') fails.push(`texto: esperaba 20 puntos, hay ${pts}`);
    await page.click('.text-step.active .step-primary'); await waitCurtain(page);

    await page.click('#submitBtn');
    if (await page.evaluate(() => document.body.classList.contains('done'))) fails.push('submit pasó sin consentimiento');
    await page.check('#consent'); await page.click('#submitBtn'); await page.waitForTimeout(1300);
    if (!(await page.evaluate(() => document.body.classList.contains('done')))) fails.push('no llegó a gracias');
    if (await page.isVisible('body > .hero') || await page.isVisible('body > .mecanica-sec')) fails.push('la landing larga reaparece antes del agradecimiento');
    if (await page.textContent('#grPts') !== '20') fails.push('gracias no muestra 20 puntos');

    const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('#gReviewBtn')]);
    await popup.close().catch(() => {});
    await page.click('#gConfirmBtn'); await page.waitForTimeout(2900);
    if (!(await page.isVisible('#gDone'))) fails.push('reseña de Google no termina');
    if (await page.textContent('#grPts') !== '40') fails.push('reseña de Google no duplica puntos');

    const p2 = await ctx.newPage();
    await p2.goto(URL, { waitUntil: 'networkidle' });
    await p2.click('#startFlow'); await waitCurtain(p2);
    await p2.locator('.flow-step.active input[type=file]').setInputFiles(testImage);
    await p2.goBack(); await p2.waitForTimeout(500);
    if (!(await p2.evaluate(() => document.getElementById('exitModal').open))) fails.push('exit popup no aparece con puntos cargados');

    const p3 = await ctx.newPage();
    await p3.goto(URL, { waitUntil: 'networkidle' });
    await reachConfirm(p3);
    await p3.click('#openBases');
    if (!(await p3.evaluate(() => document.getElementById('basesModal').open))) fails.push('modal de bases no abre');
  }
  await ctx.close();
}

const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dpage = await dctx.newPage();
await dpage.goto(URL, { waitUntil: 'networkidle' });
await dpage.screenshot({ path: `${OUT}/canonical-1280-intro.png` });
await dctx.close();

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: multistep 9 etapas, 1 CTA en portada, premios concretos, puntos 10/15/20, consentimiento, gracias, Google, exit y bases');
