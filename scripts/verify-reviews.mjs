// Verificación funcional del flujo multistep Rollershow Reviews.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const OUT = 'C:/Users/Agus/Desktop/rollershow-reviews/_scratch';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const fails = [];
const waitCurtain = page => page.waitForTimeout(1450);
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

for (const vp of [{ w: 320, h: 700 }, { w: 360, h: 780 }, { w: 390, h: 844 }]) {
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
    startCopy: document.querySelector('#startFlow')?.textContent.trim(),
    bannedCopy: /[·—]/.test(document.querySelector('#flowApp')?.innerText || ''),
    copy: {
      rating: document.querySelector('.rating-step .step-title')?.textContent,
      audio: document.querySelector('.audio-step .step-title')?.textContent,
      text: document.querySelector('.text-step .step-title')?.textContent,
      confirm: document.querySelector('.confirm-step .step-title')?.textContent,
      consent: document.querySelector('#consentBox label')?.textContent,
      google: document.querySelector('#gBlock h3')?.textContent,
    },
  }));
  if (initial.overflow > 0) fails.push(`${vp.w}px: overflow horizontal ${initial.overflow}`);
  if (initial.active !== 'intro') fails.push(`${vp.w}px: la portada no es el primer paso`);
  if (initial.primaries !== 1) fails.push(`${vp.w}px: la portada tiene ${initial.primaries} CTAs primarios`);
  if (!initial.prizes) fails.push(`${vp.w}px: faltan los premios concretos`);
  if (!initial.startCopy?.includes('Mostrar mi casa')) fails.push(`${vp.w}px: el CTA inicial no expresa la acción concreta`);
  if (initial.bannedCopy) fails.push(`${vp.w}px: el flujo conserva separadores de copy vetados`);
  if (!initial.copy.rating?.includes('experiencia con Rollershow') || initial.copy.audio !== 'Contalo con tu voz.' ||
      !initial.copy.text?.includes('frase que ayude') || initial.copy.confirm !== 'Ya casi está.' ||
      !initial.copy.consent?.includes('audio') || !initial.copy.google?.includes('duplicar tus chances')) {
    fails.push(`${vp.w}px: el recorrido conserva copy genérico o incompleto ${JSON.stringify(initial.copy)}`);
  }
  const environments = await page.evaluate(() => [...document.querySelectorAll('.item-step')].map(step => ({
    title: step.querySelector('.step-title').textContent,
    src: step.querySelector('.curtain-photo img').getAttribute('src'),
    width: step.querySelector('.curtain-photo img').naturalWidth,
    unified: !!step.querySelector('.item-stage .item-visual') && !!step.querySelector('.item-stage .item-task'),
  })));
  if (environments[0]?.title !== 'Living' || !environments[0]?.src.includes('living') ||
      environments[1]?.title !== 'Dormitorio' || !environments[1]?.src.includes('bedroom') ||
      environments[2]?.title !== 'Escritorio' || environments[3]?.title !== 'Home office') {
    fails.push(`${vp.w}px: fotos y nombres de ambientes no corresponden ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => item.width < 1000 || item.src.includes('thumb') || !item.unified)) {
    fails.push(`${vp.w}px: placeholders sin resolución fuente o módulo fragmentado ${JSON.stringify(environments)}`);
  }
  await page.screenshot({ path: `${OUT}/canonical-${vp.w}-intro.png` });

  if (vp.w === 320) {
    await page.click('#startFlow'); await waitCurtain(page);
    await page.screenshot({ path: `${OUT}/canonical-320-item.png` });
  }

  if (vp.w === 390) {
    await page.click('#startFlow'); await waitCurtain(page);
    if (await page.getAttribute('.flow-step.active', 'data-flow-step') !== 'item-1') fails.push('el CTA no abre la primera cortina');
    await page.screenshot({ path: `${OUT}/canonical-390-item.png` });

    await page.locator('.flow-step.active input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(120);
    const photoReward = await page.evaluate(() => ({
      kind: document.querySelector('.reward-moment')?.dataset.kind,
      points: document.querySelector('.reward-points')?.textContent,
      live: document.querySelector('#rewardLive')?.textContent,
      count: document.querySelectorAll('.reward-moment').length,
      local: document.querySelector('.item-step.active')?.classList.contains('media-reward'),
    }));
    if (photoReward.kind !== 'photo' || photoReward.points !== '+10' || !photoReward.live?.includes('Foto cargada') || photoReward.count !== 1 || !photoReward.local) {
      fails.push(`foto: recompensa incompleta ${JSON.stringify(photoReward)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-photo-reward.png` });
    await page.waitForTimeout(180);
    let pts = await page.textContent('#flowPts');
    if (pts !== '10') fails.push(`foto: esperaba 10 puntos, hay ${pts}`);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }

    await page.locator('#stars button').nth(4).click();
    const ratingReward = await page.evaluate(() => ({
      kind: document.querySelector('.reward-moment')?.dataset.kind,
      points: document.querySelector('.reward-points')?.textContent,
      local: document.querySelector('.rating-step')?.classList.contains('rating-reward'),
    }));
    if (ratingReward.kind !== 'rating' || ratingReward.points !== '+5' || !ratingReward.local) fails.push(`estrellas: recompensa incompleta ${JSON.stringify(ratingReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '15') fails.push(`estrellas: esperaba 15 puntos, hay ${pts}`);
    await page.click('#ratingNext'); await waitCurtain(page);
    await page.click('.audio-step.active [data-flow-next]'); await waitCurtain(page);
    await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
    const textReward = await page.evaluate(() => ({
      kind: document.querySelector('.reward-moment')?.dataset.kind,
      points: document.querySelector('.reward-points')?.textContent,
      local: document.querySelector('.text-step')?.classList.contains('text-reward'),
    }));
    if (textReward.kind !== 'text' || textReward.points !== '+5' || !textReward.local) fails.push(`texto: recompensa incompleta ${JSON.stringify(textReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '20') fails.push(`texto: esperaba 20 puntos, hay ${pts}`);
    await page.click('.text-step.active .step-primary'); await waitCurtain(page);

    await page.click('#submitBtn');
    if (await page.evaluate(() => document.body.classList.contains('done'))) fails.push('submit pasó sin consentimiento');
    await page.check('#consent'); await page.click('#submitBtn'); await page.waitForTimeout(1300);
    if (!(await page.evaluate(() => document.body.classList.contains('done')))) fails.push('no llegó a gracias');
    if (await page.isVisible('body > .hero') || await page.isVisible('body > .mecanica-sec')) fails.push('la landing larga reaparece antes del agradecimiento');
    if (await page.textContent('#grPts') !== '20') fails.push('gracias no muestra 20 puntos');
    const googleHandoff = await page.evaluate(() => {
      const button = document.querySelector('#gReviewBtn');
      const url = new URL(button.href);
      return {
        focused: document.activeElement === button,
        highlighted: button.classList.contains('google-focus'),
        host: url.hostname,
        path: url.pathname,
        api: url.searchParams.get('api'),
        query: url.searchParams.get('query'),
      };
    });
    if (!googleHandoff.focused || !googleHandoff.highlighted) fails.push(`Google no recibe foco al finalizar ${JSON.stringify(googleHandoff)}`);
    if (googleHandoff.host !== 'www.google.com' || !googleHandoff.path.startsWith('/maps/search/') || googleHandoff.api !== '1' || !googleHandoff.query?.includes('RollerShow')) {
      fails.push(`enlace oficial de Google Maps incorrecto ${JSON.stringify(googleHandoff)}`);
    }

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
await dpage.evaluate(() => window.celebrateAction('audio', { points:30, anchor:document.querySelector('#startFlow'), detail:'Audio guardado' }));
const audioReward = await dpage.evaluate(() => ({ kind:document.querySelector('.reward-moment')?.dataset.kind, live:document.querySelector('#rewardLive')?.textContent }));
if (audioReward.kind !== 'audio' || !audioReward.live?.includes('30 puntos')) fails.push(`audio: recompensa invocable y accesible incompleta ${JSON.stringify(audioReward)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-intro.png` });
await dpage.click('#startFlow'); await waitCurtain(dpage);
await dpage.screenshot({ path: `${OUT}/canonical-1280-item.png` });
await dpage.evaluate(() => window.celebrateAction('photo', { points:10, anchor:document.querySelector('.flow-step.active .upload-zone'), detail:'Foto cargada' }));
await dpage.waitForTimeout(120);
await dpage.screenshot({ path: `${OUT}/canonical-1280-photo-reward.png` });
await dctx.close();

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: multistep, recompensas foto/estrellas/audio/texto, puntos, consentimiento, gracias, Google, exit y bases');
