// Verificación funcional del flujo multistep Rollershow Reviews.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const OUT = 'C:/Users/Agus/Desktop/rollershow-reviews/_scratch';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'] });
const fails = [];
const waitCurtain = page => page.waitForTimeout(1450);
const testImage = 'C:/Users/Agus/Desktop/rollershow-reviews/img/blackout-sand-bedroom.jpg';

async function reachConfirm(page, { withPhoto = false } = {}) {
  await page.click('#startFlow'); await waitCurtain(page);
  if (withPhoto) {
    await page.locator('.flow-step.active .item-task input[type=file]').setInputFiles(testImage);
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
    bases: document.querySelector('.bases-txt')?.textContent,
    startCopy: document.querySelector('#startFlow')?.textContent.trim(),
    bannedCopy: /[·—]/.test(document.querySelector('#flowApp')?.innerText || ''),
    copy: {
      rating: document.querySelector('.rating-step .step-title')?.textContent,
      audio: document.querySelector('.audio-step .step-title')?.textContent,
      text: document.querySelector('.text-step .step-title')?.textContent,
      confirm: document.querySelector('.confirm-step .step-title')?.textContent,
      consent: document.querySelector('#consentBox label')?.textContent,
      google: document.querySelector('#gBlock h3')?.textContent,
      ratingAction: document.querySelector('#starsWord')?.textContent,
      textAction: document.querySelector('.text-reward-label')?.textContent,
    googleAction: document.querySelector('#gReviewBtn')?.textContent,
    },
    introGeometry: (() => {
      const step=document.querySelector('.intro-step'), logo=document.querySelector('.intro-logo').getBoundingClientRect();
      const copy=document.querySelector('.intro-copy-block').getBoundingClientRect(), cta=document.querySelector('#startFlow').getBoundingClientRect();
      return {copyTop:copy.top,logoBottom:logo.bottom,ctaBottom:cta.bottom,viewport:innerHeight,scroll:step.scrollHeight-step.clientHeight};
    })(),
  }));
  if (initial.overflow > 0) fails.push(`${vp.w}px: overflow horizontal ${initial.overflow}`);
  if (initial.active !== 'intro') fails.push(`${vp.w}px: la portada no es el primer paso`);
  if (initial.primaries !== 1) fails.push(`${vp.w}px: la portada tiene ${initial.primaries} CTAs primarios`);
  if (!initial.prizes) fails.push(`${vp.w}px: faltan los premios concretos`);
  if (!initial.bases?.includes('@cortinas.rollershow') || !initial.bases?.includes('Instagram no patrocina')) fails.push(`${vp.w}px: las bases no explican seguimiento obligatorio y descargo de Instagram`);
  if (!initial.startCopy?.includes('Mostrar mi casa')) fails.push(`${vp.w}px: el CTA inicial no expresa la acción concreta`);
  if (initial.bannedCopy) fails.push(`${vp.w}px: el flujo conserva separadores de copy vetados`);
  if (!initial.copy.rating?.includes('experiencia con Rollershow') || initial.copy.audio !== 'Contalo con tu voz.' ||
      !initial.copy.text?.includes('Ayudá a otra persona') || !initial.copy.confirm?.startsWith('Mostraste ') ||
      !initial.copy.consent?.includes('audio') || !initial.copy.google?.includes('Duplicá tus chances')) {
    fails.push(`${vp.w}px: el recorrido conserva copy genérico o incompleto ${JSON.stringify(initial.copy)}`);
  }
  if (!initial.copy.ratingAction?.includes('+5 puntos') || !initial.copy.textAction?.includes('+5 puntos') ||
      !initial.copy.googleAction?.includes('duplicá tus puntos')) fails.push(`${vp.w}px: una acción no anticipa su impacto ${JSON.stringify(initial.copy)}`);
  if (initial.introGeometry.copyTop > initial.introGeometry.viewport * .46 || initial.introGeometry.ctaBottom > initial.introGeometry.viewport - 12 ||
      initial.introGeometry.scroll > 2 || initial.introGeometry.copyTop - initial.introGeometry.logoBottom > initial.introGeometry.viewport * .3) {
    fails.push(`${vp.w}px: portada mobile desbalanceada o CTA cortado ${JSON.stringify(initial.introGeometry)}`);
  }
  const environments = await page.evaluate(() => [...document.querySelectorAll('.item-step')].map(step => ({
    title: step.querySelector('.step-title').textContent,
    src: step.querySelector('.curtain-photo img').getAttribute('src'),
    width: step.querySelector('.curtain-photo img').naturalWidth,
    unified: !!step.querySelector('.item-stage .item-visual') && !!step.querySelector('.item-stage .item-task'),
    structuralNoise: !!step.querySelector('.step-kicker,.curtain-meta,.next-peek,.stage-media-status'),
    uploadReward: step.querySelector('.upload-value')?.textContent,
  })));
  if (environments[0]?.title !== 'Living' || !environments[0]?.src.includes('living') ||
      environments[1]?.title !== 'Dormitorio' || !environments[1]?.src.includes('bedroom') ||
      environments[2]?.title !== 'Escritorio' || environments[3]?.title !== 'Home office') {
    fails.push(`${vp.w}px: fotos y nombres de ambientes no corresponden ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => item.width < 1000 || item.src.includes('thumb') || !item.src.includes('-blurred') || !item.unified || item.structuralNoise)) {
    fails.push(`${vp.w}px: placeholders sin resolución fuente o módulo fragmentado ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => !item.uploadReward?.includes('Foto +10 puntos') || !item.uploadReward?.includes('Video +25 puntos'))) {
    fails.push(`${vp.w}px: el CTA de carga no anticipa foto +10 y video +25 ${JSON.stringify(environments)}`);
  }
  await page.screenshot({ path: `${OUT}/canonical-${vp.w}-intro.png` });

  if (vp.w === 320) {
    await page.click('#startFlow'); await waitCurtain(page);
    await page.screenshot({ path: `${OUT}/canonical-320-item.png` });
  }

  if (vp.w === 390) {
    await page.click('#startFlow'); await waitCurtain(page);
    if (await page.getAttribute('.flow-step.active', 'data-flow-step') !== 'item-1') fails.push('el CTA no abre la primera cortina');
    const scoreRoller = await page.evaluate(() => {
      const score = document.querySelector('.flow-score');
      const roller = document.querySelector('.score-roller');
      const rect = roller.getBoundingClientRect();
      return {
        width:Math.round(rect.width), height:Math.round(rect.height),
        scoreWidth:Math.round(score.getBoundingClientRect().width),
        visible:getComputedStyle(roller).display !== 'none' && getComputedStyle(roller).opacity !== '0',
        material:getComputedStyle(roller).backgroundImage,
        fullRule:getComputedStyle(score).borderBottomWidth,
      };
    });
    if (!scoreRoller.visible || Math.abs(scoreRoller.width-scoreRoller.scoreWidth) > 2 || scoreRoller.height < 8 || !scoreRoller.material.includes('linear-gradient') || scoreRoller.fullRule !== '0px') {
      fails.push(`puntaje: el roller persistente o la eliminación de la línea falló ${JSON.stringify(scoreRoller)}`);
    }
    const skipPlacement = await page.evaluate(() => {
      const step=document.querySelector('.item-step.active'), stage=step.querySelector('.item-stage').getBoundingClientRect();
      const prompt=step.querySelector('.upload-prompt').getBoundingClientRect(), skip=step.querySelector('.stage-skip').getBoundingClientRect();
      return {inside:!!step.querySelector('.item-task>.stage-skip'),stage:{bottom:stage.bottom},prompt:{left:prompt.left,right:prompt.right,bottom:prompt.bottom},skip:{left:skip.left,right:skip.right,top:skip.top,bottom:skip.bottom}};
    });
    if (!skipPlacement.inside || skipPlacement.skip.bottom > skipPlacement.stage.bottom + 1 || skipPlacement.skip.top < skipPlacement.prompt.bottom - 1 ||
        Math.abs(skipPlacement.skip.left-skipPlacement.prompt.left) > 2 || Math.abs(skipPlacement.skip.right-skipPlacement.prompt.right) > 2) {
      fails.push(`seguir sin foto: no pertenece al bloque de carga ${JSON.stringify(skipPlacement)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-item.png` });

    await page.locator('.flow-step.active .item-task input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(620);
    const photoReward = await page.evaluate(() => ({
      points: document.querySelector('.item-step.active .stage-score-burst strong')?.textContent,
      live: document.querySelector('#rewardLive')?.textContent,
      genericCount: document.querySelectorAll('.reward-moment').length,
      local: document.querySelector('.item-step.active')?.classList.contains('media-reward'),
      replacement: !!document.querySelector('.item-step.active .stage-user-media'),
      separatePreview: !!document.querySelector('.item-step.active .item-stage > .previews'),
      placeholderHidden: getComputedStyle(document.querySelector('.item-step.active .reference-media')).opacity === '0',
      remove: !!document.querySelector('.item-step.active .stage-remove'),
      addMore: getComputedStyle(document.querySelector('.item-step.active .upload-more-action')).display !== 'none',
      randomVisuals: document.querySelectorAll('.reward-moment,.reward-flight,.score-paper').length,
      bannedSeparators: /[·—]/.test(document.querySelector('.item-step.active .stage-score-burst')?.innerText || ''),
      transfer: document.querySelector('.score-transfer')?.textContent,
      transferAnimated: (document.querySelector('.score-transfer')?.getAnimations().length || 0) > 0,
      actionTray: (() => {
        const stage = document.querySelector('.item-step.active .item-stage').getBoundingClientRect();
        const actions = document.querySelector('.item-step.active .step-actions').getBoundingClientRect();
        return { attached: Math.abs(stage.bottom - actions.top) < 2, sameLeft: Math.abs(stage.left - actions.left) < 2, sameRight: Math.abs(stage.right - actions.right) < 2 };
      })(),
    }));
    if (photoReward.points !== '+10' || !photoReward.live?.includes('Foto cargada') || photoReward.genericCount !== 0 || !photoReward.local ||
        !photoReward.replacement || photoReward.separatePreview || !photoReward.placeholderHidden || !photoReward.remove || !photoReward.addMore || photoReward.randomVisuals !== 0 || photoReward.bannedSeparators || photoReward.transfer !== '+10' || !photoReward.transferAnimated ||
        !photoReward.actionTray.attached || !photoReward.actionTray.sameLeft || !photoReward.actionTray.sameRight) {
      fails.push(`foto: recompensa incompleta ${JSON.stringify(photoReward)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-photo-reward.png` });
    await page.waitForTimeout(180);
    let pts = await page.textContent('#flowPts');
    if (pts !== '10') fails.push(`foto: esperaba 10 puntos, hay ${pts}`);
    const addMoreCopy = (await page.textContent('.flow-step.active .upload-more-action')) || '';
    if (!addMoreCopy.includes('+10 puntos') || !addMoreCopy.includes('+25 puntos')) fails.push(`sumar otro archivo no recuerda su recompensa ${addMoreCopy}`);
    await page.locator('.flow-step.active .upload-more-action input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(80);
    if (await page.textContent('#flowPts') !== '20') fails.push('segunda foto: no suma puntos');
    await page.click('.flow-step.active .stage-remove');
    if (await page.textContent('#flowPts') !== '10' || !(await page.isVisible('.flow-step.active .stage-user-media'))) fails.push('quitar la foto activa no recupera la anterior');
    await page.click('.flow-step.active .stage-remove');
    const emptyStage = await page.evaluate(() => ({ points:document.querySelector('#flowPts')?.textContent, media:!!document.querySelector('.flow-step.active .stage-user-media'), hasMedia:document.querySelector('.flow-step.active')?.classList.contains('has-media') }));
    if (emptyStage.points !== '0' || emptyStage.media || emptyStage.hasMedia) fails.push(`quitar la última foto no recupera el placeholder ${JSON.stringify(emptyStage)}`);
    await page.locator('.flow-step.active .item-task input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(80);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }

    await page.locator('#stars button').nth(4).click();
    const ratingReward = await page.evaluate(() => ({
      live: document.querySelector('#rewardLive')?.textContent,
      randomVisuals: document.querySelectorAll('.reward-moment,.reward-flight').length,
      local: document.querySelector('.rating-step')?.classList.contains('rating-reward'),
    }));
    if (!ratingReward.live?.includes('5 puntos') || ratingReward.randomVisuals !== 0 || !ratingReward.local) fails.push(`estrellas: recompensa incompleta ${JSON.stringify(ratingReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '15') fails.push(`estrellas: esperaba 15 puntos, hay ${pts}`);
    await page.click('#ratingNext'); await waitCurtain(page);
    await page.evaluate(() => renderAudio('recording'));
    const mobileRecording = await page.evaluate(() => {
      const stop = document.querySelector('#recStop');
      const content = document.querySelector('.audio-step .step-content');
      return {
        stopWidth: Math.round(stop.getBoundingClientRect().width),
        contentWidth: Math.round(content.getBoundingClientRect().width),
        actionsHidden: getComputedStyle(document.querySelector('.audio-step .step-actions')).display === 'none',
        rootBackground: getComputedStyle(document.documentElement).backgroundColor,
      };
    });
    if (mobileRecording.stopWidth < mobileRecording.contentWidth - 2 || !mobileRecording.actionsHidden || mobileRecording.rootBackground === 'rgba(0, 0, 0, 0)') fails.push(`audio mobile: jerarquía o fondo incorrectos ${JSON.stringify(mobileRecording)}`);
    await page.screenshot({ path: `${OUT}/canonical-390-audio-recording.png` });
    await page.evaluate(() => renderAudio('idle'));
    await page.click('.audio-step.active [data-flow-next]'); await waitCurtain(page);
    await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
    const textReward = await page.evaluate(() => ({
      live: document.querySelector('#rewardLive')?.textContent,
      randomVisuals: document.querySelectorAll('.reward-moment,.reward-flight').length,
      local: document.querySelector('.text-step')?.classList.contains('text-reward'),
    }));
    if (!textReward.live?.includes('5 puntos') || textReward.randomVisuals !== 0 || !textReward.local) fails.push(`texto: recompensa incompleta ${JSON.stringify(textReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '20') fails.push(`texto: esperaba 20 puntos, hay ${pts}`);
    await page.click('.text-step.active .step-primary'); await waitCurtain(page);

    const confirmBefore = await page.evaluate(() => ({
      submitDisabled: document.querySelector('#submitBtn').disabled,
      authorized: document.querySelector('.confirm-step').classList.contains('is-authorized'),
      rollers: document.querySelectorAll('.confirm-step .celebration-roller').length,
      prizes: document.querySelectorAll('.confirm-step .confirm-world img').length,
      proof: document.querySelector('#confirmProof').textContent,
      consentBg: getComputedStyle(document.querySelector('#consentBox')).backgroundColor,
      fabricatedAverage: /promedio|veces más que/i.test(document.querySelector('.confirm-step').innerText),
      concretePrizes: document.querySelector('.confirm-prize-reminder')?.textContent,
      scoreBackground: getComputedStyle(document.querySelector('#flowScore')).backgroundColor,
      compactHeader: [...document.querySelectorAll('#flowScore>span:not(.score-roller),#flowScore>i')].every(element => getComputedStyle(element).opacity === '0'),
      rollerVisible: getComputedStyle(document.querySelector('.score-roller')).opacity !== '0',
      hero: {
        src: document.querySelector('.confirm-prize-base')?.getAttribute('src'),
        srcset: document.querySelector('.confirm-prize-base')?.getAttribute('srcset'),
        current: document.querySelector('.confirm-prize-base')?.currentSrc,
      },
    }));
    if (!confirmBefore.submitDisabled || confirmBefore.authorized || confirmBefore.rollers !== 3 || confirmBefore.prizes !== 3 ||
        confirmBefore.proof !== 'Cada chance participa por separado.' || confirmBefore.fabricatedAverage || !confirmBefore.concretePrizes?.includes('3 almohadones y 2 alfombras premium') ||
        confirmBefore.scoreBackground !== 'rgba(0, 0, 0, 0)' || !confirmBefore.compactHeader || !confirmBefore.rollerVisible || !confirmBefore.hero.src?.includes('768') ||
        !confirmBefore.hero.srcset?.includes('1024w') || !confirmBefore.hero.srcset?.includes('1536w') || !confirmBefore.hero.current?.includes('1024') ||
        !['rgb(198, 58, 33)','rgb(151, 41, 15)'].includes(confirmBefore.consentBg)) {
      fails.push(`confirmación inicial: jerarquía o evidencia incorrecta ${JSON.stringify(confirmBefore)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-confirm-consent.png` });
    if (await page.evaluate(() => document.body.classList.contains('done'))) fails.push('el flujo terminó antes del consentimiento');
    await page.check('#consent'); await page.waitForTimeout(250);
    const confirmAfter = await page.evaluate(() => ({
      submitDisabled: document.querySelector('#submitBtn').disabled,
      authorized: document.querySelector('.confirm-step').classList.contains('is-authorized'),
      title: document.querySelector('#confirmTitle').textContent,
      live: document.querySelector('#rewardLive').textContent,
    }));
    if (confirmAfter.submitDisabled || !confirmAfter.authorized || confirmAfter.title !== 'Ya autorizaste el material.' || !confirmAfter.live.includes('Autorización lista')) {
      fails.push(`confirmación autorizada: relevo de CTA incompleto ${JSON.stringify(confirmAfter)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-confirm-ready.png` });
    await page.click('#submitBtn'); await page.waitForTimeout(3300);
    if (!(await page.evaluate(() => document.body.classList.contains('done')))) fails.push('no llegó a gracias');
    if (await page.isVisible('body > .hero') || await page.isVisible('body > .mecanica-sec')) fails.push('la landing larga reaparece antes del agradecimiento');
    if (await page.textContent('#grPts') !== '20') fails.push('gracias no muestra 20 puntos');
    const celebration = await page.evaluate(() => {
      const chance = document.querySelector('.gr-chances strong');
      const points = document.querySelector('.gr-points strong');
      const chanceSurface = getComputedStyle(document.querySelector('.gr-chances'));
      const canvas = document.querySelector('#celebrationCanvas');
      return {
        title: document.querySelector('#thanksTitle')?.textContent,
        sub: document.querySelector('#grSub')?.textContent,
        chanceSize: parseFloat(getComputedStyle(chance).fontSize),
        pointsSize: parseFloat(getComputedStyle(points).fontSize),
        surface: chanceSurface.backgroundColor,
        border: chanceSurface.borderTopWidth,
        canvasWidth: canvas.width,
        particles: window.__celebrationState?.particles || 0,
        running: window.__celebrationState?.running || false,
        numberMotion: getComputedStyle(chance).animationName,
        oldConfetti: document.querySelectorAll('.confetti').length,
      };
    });
    if (!celebration.title?.startsWith('¡Lo hiciste') || !celebration.sub?.includes('duplicar tus chances en Google') || celebration.chanceSize < 100 || celebration.pointsSize < 65 ||
        celebration.surface !== 'rgba(0, 0, 0, 0)' || celebration.border !== '0px' || celebration.canvasWidth < 390 ||
        celebration.particles < 35 || celebration.particles > 180 || !celebration.running || celebration.numberMotion !== 'none' || celebration.oldConfetti !== 0) {
      fails.push(`festejo final: sigue siendo una confirmación plana o en cards ${JSON.stringify(celebration)}`);
    }
    const googleHandoff = await page.evaluate(() => {
      const button = document.querySelector('#gReviewBtn');
      const url = new URL(button.href);
      return {
        focused: document.activeElement === button,
        highlighted: button.classList.contains('google-focus'),
        buttonRect: { top:button.getBoundingClientRect().top, bottom:button.getBoundingClientRect().bottom },
        chanceTop: document.querySelector('.gr-chances strong').getBoundingClientRect().top,
        viewportHeight: innerHeight,
        host: url.hostname,
        path: url.pathname,
        href: button.href,
      };
    });
    if (!googleHandoff.focused || !googleHandoff.highlighted || googleHandoff.buttonRect.top < 0 || googleHandoff.buttonRect.bottom > googleHandoff.viewportHeight || googleHandoff.chanceTop < -2) {
      fails.push(`Google no recibe foco sin cortar el logro ${JSON.stringify(googleHandoff)}`);
    }
    if (googleHandoff.host !== 'www.google.com'
      || !googleHandoff.path.startsWith('/maps/place/Cortinas+RollerShow/')
      || !googleHandoff.href.includes('0x95bcb6719099596b:0x4354517b56352268')
      || !googleHandoff.href.includes('!9m1!1b1')) {
      fails.push(`enlace directo al compositor de reseñas incorrecto ${JSON.stringify(googleHandoff)}`);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${OUT}/canonical-390-thanks.png`, fullPage:true });
    await page.locator('#gReviewBtn').evaluate(el => el.scrollIntoView({block:'center', behavior:'instant'}));

    const [popup] = await Promise.all([ctx.waitForEvent('page'), page.locator('#gReviewBtn').click({ force:true, noWaitAfter:true })]);
    await popup.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    if (!popup.url().includes('google.com/')) fails.push(`el CTA de reseña no abrió Google ${popup.url()}`);
    await popup.close().catch(() => {});
    if ((await page.textContent('#gConfirmBtn'))?.trim() !== 'Listo, ya la publiqué') fails.push('la vuelta de Google no pide confirmación clara');
    if (!((await page.textContent('#gValidating')) || '').includes('Registrando tu confirmación')) fails.push('Google finge una verificación que la app no puede hacer');
    await page.click('#gConfirmBtn'); await page.waitForTimeout(2900);
    if (!(await page.isVisible('#gDone'))) fails.push('reseña de Google no termina');
    if (await page.textContent('#grPts') !== '40') fails.push('reseña de Google no duplica puntos');
    const googleDone = await page.evaluate(() => ({
      icon: Math.round(document.querySelector('.g-status>svg').getBoundingClientRect().width),
      status: document.querySelector('#gDone strong')?.textContent,
      title: document.querySelector('#gTitle')?.textContent,
      instagramCopy: document.querySelector('#igFinalBtn')?.textContent,
      instagramHref: document.querySelector('#igFinalBtn')?.href,
      instagramFocused: document.activeElement === document.querySelector('#igFinalBtn'),
      instagramWidth: Math.round(document.querySelector('#igFinalBtn').getBoundingClientRect().width),
      blockWidth: Math.round(document.querySelector('#gBlock').getBoundingClientRect().width),
      requirement: document.querySelector('.ig-final p')?.textContent,
      sub: document.querySelector('#grSub')?.textContent,
      oldInstagramHidden: getComputedStyle(document.querySelector('.gr-meta')).display === 'none',
      completeState: document.body.classList.contains('google-complete'),
      orbitA: getComputedStyle(document.querySelector('#gBlock'),'::before').display,
      orbitB: getComputedStyle(document.querySelector('#gBlock'),'::after').display,
      divider: getComputedStyle(document.querySelector('.gr-score'),'::after').display,
    }));
    if (googleDone.icon < 44 || !googleDone.status?.includes('duplicamos tus puntos') || googleDone.title !== 'Te queda un último paso' ||
        !googleDone.instagramCopy?.includes('ver si gané') || !googleDone.instagramHref?.includes('instagram.com/cortinas.rollershow') ||
        !googleDone.instagramFocused || googleDone.instagramWidth < googleDone.blockWidth - 2 || !googleDone.requirement?.includes('31 de julio') ||
        !googleDone.sub?.includes('Instagram es el último requisito') ||
        !googleDone.requirement?.includes('requisito') || !googleDone.oldInstagramHidden || !googleDone.completeState ||
        googleDone.orbitA !== 'none' || googleDone.orbitB !== 'none' || googleDone.divider !== 'none') {
      fails.push(`cierre Google: estado o geometría decorativa incorrectos ${JSON.stringify(googleDone)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-google-done.png`, fullPage:true });

    const p2 = await ctx.newPage();
    await p2.goto(URL, { waitUntil: 'networkidle' });
    await p2.click('#startFlow'); await waitCurtain(p2);
    await p2.locator('.flow-step.active .item-task input[type=file]').setInputFiles(testImage);
    await p2.waitForFunction(() => document.querySelector('#flowPts')?.textContent === '10');
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

// Una foto real de teléfono no debe quedar en memoria con resolución y peso originales.
const cctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const cpage = await cctx.newPage();
await cpage.goto(URL, { waitUntil:'networkidle' });
await cpage.click('#startFlow'); await waitCurtain(cpage);
const compression = await cpage.evaluate(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2400; canvas.height = 1800;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#826751'); gradient.addColorStop(.5, '#e7ded2'); gradient.addColorStop(1, '#42382f');
  context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .98));
  const original = new File([blob], 'foto-celular.jpg', { type:'image/jpeg' });
  const step = document.querySelector('.item-step.active');
  await window.addFiles(1, [original], step);
  const entry = state.archivos[1][0];
  return {
    originalBytes:original.size,
    resultBytes:entry.file.size,
    width:entry.width,
    height:entry.height,
    type:entry.file.type,
    compressed:entry.compressed,
    busy:step.hasAttribute('aria-busy'),
    points:document.querySelector('#flowPts').textContent,
    preview:!!step.querySelector('.stage-user-media'),
  };
});
if (!compression.compressed || compression.width !== 1600 || compression.height !== 1200 || compression.type !== 'image/jpeg' ||
    compression.resultBytes >= compression.originalBytes || compression.busy || compression.points !== '10' || !compression.preview) {
  fails.push(`compresión: foto mobile no se prepara antes de usar ${JSON.stringify(compression)}`);
}
await cctx.close();

const dctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions:['microphone'] });
const dpage = await dctx.newPage();
await dpage.goto(URL, { waitUntil: 'networkidle' });
await dpage.evaluate(() => window.celebrateAction('audio', { points:30, origin:document.querySelector('#startFlow'), detail:'Audio guardado' }));
const audioReward = await dpage.evaluate(() => ({ randomVisuals:document.querySelectorAll('.reward-moment,.reward-flight').length, live:document.querySelector('#rewardLive')?.textContent, transfer:document.querySelector('.score-transfer')?.textContent }));
if (audioReward.randomVisuals !== 0 || !audioReward.live?.includes('30 puntos') || audioReward.transfer !== '+30') fails.push(`audio: recompensa invocable y accesible incompleta ${JSON.stringify(audioReward)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-intro.png` });
await dpage.click('#startFlow'); await waitCurtain(dpage);
await dpage.screenshot({ path: `${OUT}/canonical-1280-item.png` });
await dpage.locator('.flow-step.active .item-task input[type=file]').setInputFiles(testImage);
await dpage.waitForTimeout(620);
const desktopTray = await dpage.evaluate(() => {
  const stage = document.querySelector('.item-step.active .item-stage').getBoundingClientRect();
  const actions = document.querySelector('.item-step.active .step-actions').getBoundingClientRect();
  const primary = document.querySelector('.item-step.active .step-continue').getBoundingClientRect();
  return {
    attached: Math.abs(stage.bottom - actions.top) < 2,
    sameLeft: Math.abs(stage.left - actions.left) < 2,
    sameRight: Math.abs(stage.right - actions.right) < 2,
    primaryInside: primary.left >= actions.left && primary.right <= actions.right,
  };
});
if (!desktopTray.attached || !desktopTray.sameLeft || !desktopTray.sameRight || !desktopTray.primaryInside) fails.push(`foto desktop: acciones desligadas de la pieza ${JSON.stringify(desktopTray)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-photo-reward.png` });

// Audio: durante la grabación, detener es la única acción dominante. Detener no avanza.
await dpage.click('.flow-step.active .step-continue'); await waitCurtain(dpage);
for (let i = 0; i < 3; i++) { await dpage.click('.flow-step.active .step-secondary'); await waitCurtain(dpage); }
await dpage.locator('#stars button').nth(4).click();
await dpage.click('#ratingNext'); await waitCurtain(dpage);
if (!((await dpage.textContent('#recStart')) || '').includes('+30 puntos')) fails.push('grabar audio no recuerda que suma 30 puntos');
await dpage.click('#recStart');
await dpage.waitForTimeout(450);
const recordingState = await dpage.evaluate(() => {
  const step = document.querySelector('.audio-step');
  const stop = document.querySelector('#recStop');
  const box = stop.getBoundingClientRect();
  return {
    recording: step.classList.contains('is-recording'),
    stopCopy: stop.textContent.trim(),
    stopWidth: Math.round(box.width),
    contentWidth: Math.round(step.querySelector('.step-content').getBoundingClientRect().width),
    skipVisible: getComputedStyle(step.querySelector('.step-actions')).display !== 'none',
    activeStep: document.querySelector('.flow-step.active')?.dataset.flowStep,
    liveAnalyser: !!waveAnalyser,
    liveBars: [...document.querySelectorAll('.eq i')].every(bar => bar.style.transform.startsWith('scaleY(')),
    simulatedCss: [...document.querySelectorAll('.eq i')].some(bar => getComputedStyle(bar).animationName !== 'none'),
  };
});
if (!recordingState.recording || recordingState.stopCopy !== 'Terminar y guardar (+30 puntos)' || recordingState.stopWidth < recordingState.contentWidth - 2 ||
    recordingState.skipVisible || recordingState.activeStep !== 'audio' || !recordingState.liveAnalyser || !recordingState.liveBars || recordingState.simulatedCss) fails.push(`audio grabando: jerarquía u onda real incorrecta ${JSON.stringify(recordingState)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-audio-recording.png` });

await dpage.locator('#recStop').click({ force:true });
await dpage.waitForTimeout(700);
const reviewState = await dpage.evaluate(() => ({
  recorded: document.querySelector('.audio-step')?.classList.contains('has-audio'),
  recording: document.querySelector('.audio-step')?.classList.contains('is-recording'),
  player: !!document.querySelector('.voice-note'),
  rerecord: !!document.querySelector('#reRec'),
  remove: !!document.querySelector('#delRec'),
  continueVisible: getComputedStyle(document.querySelector('#audioNext')).display !== 'none',
  skipVisible: getComputedStyle(document.querySelector('.step-audio-skip')).display !== 'none',
  earned: document.querySelector('.audio-earned')?.innerText,
  points: document.querySelector('#flowPts')?.textContent,
  transfer: document.querySelector('.score-transfer')?.textContent,
}));
if (!reviewState.recorded || reviewState.recording || !reviewState.player || !reviewState.rerecord || !reviewState.remove ||
    !reviewState.continueVisible || reviewState.skipVisible || !reviewState.earned?.includes('+30 puntos') || reviewState.points !== '45' || reviewState.transfer !== '+30') fails.push(`audio detenido: revisión o recompensa incompleta ${JSON.stringify(reviewState)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-audio-review.png` });
await dpage.click('#audioNext'); await waitCurtain(dpage);
await dpage.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
await dpage.click('.text-step.active .step-primary'); await waitCurtain(dpage);
await dpage.screenshot({ path: `${OUT}/canonical-1280-confirm-consent.png` });
await dpage.check('#consent'); await dpage.waitForTimeout(250);
await dpage.screenshot({ path: `${OUT}/canonical-1280-confirm-ready.png` });
await dpage.click('#submitBtn'); await dpage.waitForTimeout(1800);
await dpage.screenshot({ path: `${OUT}/canonical-1280-thanks-entry.png`, fullPage:true });
await dpage.waitForTimeout(1500);
await dpage.screenshot({ path: `${OUT}/canonical-1280-thanks.png`, fullPage:true });
await dpage.evaluate(() => {
  document.querySelector('#gIntro').style.display='none';
  document.querySelector('#gReviewBtn').hidden=true;
  document.querySelector('#gConfirmStep').hidden=true;
  document.querySelector('#gDone').hidden=false;
  document.body.classList.add('google-complete');
  document.querySelector('#gTitle').textContent='Te queda un último paso';
  document.querySelector('#grTickets').textContent='17'; document.querySelector('#grTickets').dataset.value='17';
  document.querySelector('#grPts').textContent='170'; document.querySelector('#grPts').dataset.value='170';
});
await dpage.waitForTimeout(700);
await dpage.screenshot({ path: `${OUT}/canonical-1280-google-done.png`, fullPage:true });
await dctx.close();

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: multistep, recompensas foto/estrellas/audio/texto, puntos, consentimiento, gracias, Google, exit y bases');
