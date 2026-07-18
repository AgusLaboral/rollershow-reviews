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
    await page.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(300);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }
  } else {
    for (let i = 0; i < 4; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }
  }
  await page.locator('#stars button').nth(4).click();
  await page.click('#audioSkip');
  await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
  await page.click('#experienceNext'); await waitCurtain(page);
}

for (const vp of [{ w: 320, h: 700 }, { w: 360, h: 780 }, { w: 390, h: 700 }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    permissions: [],
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => [...document.querySelectorAll('.reference-media')].every(img =>
    img.complete && img.naturalWidth >= 1000
  ), null, { timeout: 15000 });
  await page.waitForTimeout(300);

  if (vp.w === 320) {
    const visualButtonSounds = await page.evaluate(() => {
      const targets = ['label.upload-source', 'a.g-cta', 'a.ig-final-cta'];
      const before = window.__uiSoundEvents.length;
      targets.forEach(selector => {
        const target = document.querySelector(selector);
        target.addEventListener('click', event => event.preventDefault(), { once:true });
        target.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
      });
      const sounds = window.__uiSoundEvents.slice(before).map(sound => sound.kind);
      window.__uiSoundEvents.splice(before);
      return sounds;
    });
    if (visualButtonSounds.length !== 3 || visualButtonSounds.some(kind => kind !== 'click')) {
      fails.push(`controles visuales sin clic consistente ${JSON.stringify(visualButtonSounds)}`);
    }
  }

  const initial = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    active: document.querySelector('.flow-step.active')?.dataset.flowStep,
    primaries: document.querySelectorAll('.intro-step.active .step-primary').length,
    prizes: document.body.innerText.includes('3 almohadones y 2 alfombras premium'),
    prizeConfig: SORTEO.premios.map(item => `${item.cantidad} ${item.nombre}`).join(' y '),
    prizeVisual: getComputedStyle(document.querySelector('.intro-prize-photo')).display !== 'none',
    introTitle: document.querySelector('#flowHeroTitle')?.textContent,
    introHook: document.querySelector('#introPrizeHook')?.textContent,
    introPrize: document.querySelector('#introPrizeCopy')?.textContent,
    introSaved: document.querySelector('#introSaveNote')?.textContent,
    bases: document.querySelector('.bases-txt')?.textContent,
    startCopy: document.querySelector('#startFlow')?.textContent.trim(),
    bannedCopy: /[·—]/.test(document.querySelector('#flowApp')?.innerText || ''),
    copy: {
      rating: document.querySelector('.experience-step .step-title')?.textContent,
      audio: document.querySelector('.experience-prompt strong')?.textContent,
      text: document.querySelector('.text-reward-label')?.textContent,
      confirm: document.querySelector('.confirm-step .step-title')?.textContent,
      consent: document.querySelector('#consentBox')?.textContent,
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
    introType: (() => {
      const nodes = ['#flowHeroTitle','#introPrizeHook','#introPrizeCopy','#introDateCopy'].map(selector => document.querySelector(selector));
      const styles = nodes.map(node => getComputedStyle(node));
      return {
        families:new Set(styles.map(style => style.fontFamily)).size,
        bodySame:styles[1].fontFamily === styles[2].fontFamily && styles[1].fontSize === styles[2].fontSize,
        prizeColor:styles[2].color,
        ctaColor:getComputedStyle(document.querySelector('#startFlow')).backgroundColor,
      };
    })(),
  }));
  if (initial.overflow > 0) fails.push(`${vp.w}px: overflow horizontal ${initial.overflow}`);
  if (initial.active !== 'intro') fails.push(`${vp.w}px: la portada no es el primer paso`);
  if (initial.primaries !== 1) fails.push(`${vp.w}px: la portada tiene ${initial.primaries} CTAs primarios`);
  if (!initial.prizes) fails.push(`${vp.w}px: faltan los premios concretos`);
  if (initial.prizeConfig !== '3 almohadones y 2 alfombras premium' || !initial.prizeVisual || !initial.introTitle?.toLowerCase().includes('compartí tu rollershow') ||
      !initial.introTitle?.toLowerCase().includes('sorteo') || !initial.introHook?.includes('Mostranos cómo quedó') || !initial.introPrize?.includes('Podés ganar') ||
      !initial.introSaved?.includes('avance queda guardado')) fails.push(`${vp.w}px: la portada no explica propósito, participación, premio y continuidad ${JSON.stringify(initial)}`);
  if (initial.introType.families > 2 || !initial.introType.bodySame || initial.introType.prizeColor === initial.introType.ctaColor) {
    fails.push(`${vp.w}px: la portada vuelve a mezclar demasiadas voces tipográficas ${JSON.stringify(initial.introType)}`);
  }
  if (!initial.bases?.includes('@cortinas.rollershow') || !initial.bases?.includes('Instagram no patrocina')) fails.push(`${vp.w}px: las bases no explican seguimiento obligatorio y descargo de Instagram`);
  if (initial.startCopy !== 'Participar ahora') fails.push(`${vp.w}px: el CTA inicial no expresa intención de participar`);
  if (initial.bannedCopy) fails.push(`${vp.w}px: el flujo conserva separadores de copy vetados`);
  if (initial.copy.rating !== '¿Cómo fue tu experiencia?' || !initial.copy.audio?.includes('contarlo con tu voz') ||
      !initial.copy.text?.includes('agregar una frase') || !initial.copy.confirm?.includes('participación') ||
      !initial.copy.consent?.includes('audios') || !initial.copy.consent?.includes('confirmar mi participación') || !initial.copy.google?.includes('Duplicá tus puntos')) {
    fails.push(`${vp.w}px: el recorrido conserva copy genérico o incompleto ${JSON.stringify(initial.copy)}`);
  }
  if (!initial.copy.ratingAction?.includes('+5 puntos') || !initial.copy.textAction?.includes('+5 puntos') ||
      !initial.copy.googleAction?.includes('duplicar mis puntos')) fails.push(`${vp.w}px: una acción no anticipa su impacto ${JSON.stringify(initial.copy)}`);
  if (initial.introGeometry.copyTop > initial.introGeometry.viewport * .46 || initial.introGeometry.ctaBottom > initial.introGeometry.viewport - 12 ||
      initial.introGeometry.scroll > 2 || initial.introGeometry.copyTop - initial.introGeometry.logoBottom > initial.introGeometry.viewport * .42) {
    fails.push(`${vp.w}px: portada mobile desbalanceada o CTA cortado ${JSON.stringify(initial.introGeometry)}`);
  }
  const environments = await page.evaluate(() => [...document.querySelectorAll('.item-step')].map(step => ({
    title: step.querySelector('.step-title').textContent,
    src: step.querySelector('.curtain-photo img').getAttribute('src'),
    width: step.querySelector('.curtain-photo img').naturalWidth,
    unified: !!step.querySelector('.item-stage .item-visual') && !!step.querySelector('.item-stage .item-task'),
    structuralNoise: !!step.querySelector('.step-kicker,.curtain-meta,.next-peek,.stage-media-status'),
    uploadReward: step.querySelector('.upload-value')?.textContent,
    uploadTitle: step.querySelector('.upload-prompt strong')?.textContent,
    gallery: (() => { const input=step.querySelector('.upload-library input'); return {accept:input?.accept,multiple:input?.multiple}; })(),
    camera: (() => { const input=step.querySelector('.upload-camera input'); return {accept:input?.accept,capture:input?.getAttribute('capture')}; })(),
    continueCopy: step.querySelector('.step-continue')?.textContent,
  })));
  if (environments[0]?.title !== 'Living' || !environments[0]?.src.includes('living') ||
      environments[1]?.title !== 'Dormitorio' || !environments[1]?.src.includes('bedroom') ||
      environments[2]?.title !== 'Escritorio' || environments[3]?.title !== 'Home office') {
    fails.push(`${vp.w}px: fotos y nombres de ambientes no corresponden ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => item.width < 1000 || item.src.includes('thumb') || !item.src.includes('-blurred') || !item.unified || item.structuralNoise)) {
    fails.push(`${vp.w}px: placeholders sin resolución fuente o módulo fragmentado ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => !item.uploadReward?.includes('Foto +10 puntos') || !item.uploadReward?.includes('Video +25'))) {
    fails.push(`${vp.w}px: el CTA de carga no anticipa foto +10 y video +25 ${JSON.stringify(environments)}`);
  }
  if (environments.some(item => item.uploadTitle !== 'Subí fotos o videos' || item.gallery.accept !== 'image/*,video/*' || !item.gallery.multiple ||
      item.camera.accept !== 'image/*' || item.camera.capture !== 'environment')) {
    fails.push(`${vp.w}px: la carga no ofrece galería múltiple y cámara trasera ${JSON.stringify(environments)}`);
  }
  if (environments.slice(0,-1).some(item => item.continueCopy !== 'Continuar') || environments.at(-1)?.continueCopy !== 'Dar mi opinión') {
    fails.push(`${vp.w}px: los CTAs de ambiente dependen de nombres frágiles ${JSON.stringify(environments)}`);
  }
  await page.screenshot({ path: `${OUT}/canonical-${vp.w}-intro.png` });

  if (vp.w === 320) {
    await page.click('#startFlow'); await waitCurtain(page);
    await page.screenshot({ path: `${OUT}/canonical-320-item.png` });
  }

  if (vp.w === 390) {
    await page.click('#startFlow'); await waitCurtain(page);
    if (await page.getAttribute('.flow-step.active', 'data-flow-step') !== 'item-1') fails.push('el CTA no abre la primera cortina');
    const scoreChrome = await page.evaluate(() => {
      const score = document.querySelector('.flow-score');
      return {
        persistentRollers:document.querySelectorAll('.score-roller,.roller-chain').length,
        fullRule:getComputedStyle(score).borderBottomWidth,
        scoreHeight:Math.round(score.getBoundingClientRect().height),
      };
    });
    if (scoreChrome.persistentRollers !== 0 || scoreChrome.fullRule !== '0px' || scoreChrome.scoreHeight > 40) {
      fails.push(`puntaje: reapareció chrome decorativo junto al contador ${JSON.stringify(scoreChrome)}`);
    }
    const skipPlacement = await page.evaluate(() => {
      const step=document.querySelector('.item-step.active'), stage=step.querySelector('.item-stage').getBoundingClientRect();
      const prompt=step.querySelector('.upload-prompt').getBoundingClientRect(), skip=step.querySelector('.stage-skip').getBoundingClientRect();
      const sourceNode=step.querySelector('.upload-library'), cameraNode=step.querySelector('.upload-camera'), promptNode=step.querySelector('.upload-prompt'), skipNode=step.querySelector('.stage-skip'), titleNode=step.querySelector('.upload-prompt strong');
      const source=sourceNode.getBoundingClientRect();
      return {inside:!!step.querySelector('.upload-decision>.stage-skip'),stage:{bottom:stage.bottom},prompt:{left:prompt.left,right:prompt.right,bottom:prompt.bottom,width:prompt.width,background:getComputedStyle(promptNode).backgroundColor,radius:getComputedStyle(promptNode).borderRadius,floatingIcon:Boolean(promptNode.querySelector(':scope > svg'))},skip:{left:skip.left,right:skip.right,top:skip.top,bottom:skip.bottom,radius:getComputedStyle(skipNode).borderRadius},source:{left:source.left,width:source.width,height:source.height,radius:getComputedStyle(sourceNode).borderRadius,copy:sourceNode.textContent},camera:{radius:getComputedStyle(cameraNode).borderRadius},axis:{title:titleNode.getBoundingClientRect().left,skip:skip.left}};
    });
    if (!skipPlacement.inside || skipPlacement.skip.bottom > skipPlacement.stage.bottom + 1 || skipPlacement.skip.top - skipPlacement.prompt.bottom < 15 ||
        skipPlacement.prompt.width > 362 || skipPlacement.source.height < 40 || skipPlacement.source.width < 120 ||
        skipPlacement.prompt.background !== 'rgba(0, 0, 0, 0)' || skipPlacement.prompt.radius !== '0px' ||
        skipPlacement.source.radius !== skipPlacement.camera.radius || skipPlacement.skip.radius !== '0px' ||
        skipPlacement.prompt.floatingIcon || skipPlacement.source.copy.includes('→') ||
        Math.abs(skipPlacement.axis.title-skipPlacement.axis.skip) > 2 || Math.abs(skipPlacement.axis.title-skipPlacement.source.left) > 2) {
      fails.push(`seguir sin subir: no pertenece al bloque de carga ${JSON.stringify(skipPlacement)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-item.png` });

    await page.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
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
      sound: window.__uiSoundEvents.at(-1),
      actionTray: (() => {
        const stage = document.querySelector('.item-step.active .item-stage').getBoundingClientRect();
        const actions = document.querySelector('.item-step.active .step-actions').getBoundingClientRect();
        const primary = document.querySelector('.item-step.active .step-continue').getBoundingClientRect();
        const secondary = document.querySelector('.item-step.active .upload-more-action').getBoundingClientRect();
        const center = rect => (rect.left + rect.right) / 2;
        return { attached: Math.abs(stage.bottom - actions.top) < 2, sameLeft: Math.abs(stage.left - actions.left) < 2, sameRight: Math.abs(stage.right - actions.right) < 2,
          sharedAxis: Math.abs(center(primary) - center(secondary)) < 2, stacked: secondary.top >= primary.bottom - 1 };
      })(),
    }));
    if (photoReward.points !== '+10' || !photoReward.live?.includes('Foto cargada') || photoReward.genericCount !== 0 || !photoReward.local ||
        !photoReward.replacement || photoReward.separatePreview || !photoReward.placeholderHidden || !photoReward.remove || !photoReward.addMore || photoReward.randomVisuals !== 0 || photoReward.bannedSeparators || photoReward.transfer !== '+10' || !photoReward.transferAnimated ||
        !photoReward.actionTray.attached || !photoReward.actionTray.sameLeft || !photoReward.actionTray.sameRight || !photoReward.actionTray.sharedAxis || !photoReward.actionTray.stacked ||
        photoReward.sound?.kind !== 'upload' || !photoReward.sound.played || photoReward.sound.plays !== 1 || photoReward.sound.volume > .06 || photoReward.sound.duration > .3 || photoReward.sound.voices !== 3 || photoReward.sound.error) {
      fails.push(`foto: recompensa incompleta ${JSON.stringify(photoReward)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-photo-reward.png` });
    await page.waitForTimeout(180);
    let pts = await page.textContent('#flowPts');
    if (pts !== '10') fails.push(`foto: esperaba 10 puntos, hay ${pts}`);
    const addMoreCopy = (await page.textContent('.flow-step.active .upload-more-action')) || '';
    if (!addMoreCopy.includes('Otra foto suma 10 puntos') || !addMoreCopy.includes('Otro video suma 25')) fails.push(`sumar otro archivo no recuerda su recompensa ${addMoreCopy}`);
    await page.locator('.flow-step.active .upload-more-action .upload-library input[type=file]').setInputFiles(testImage);
    await page.waitForFunction(() => document.querySelector('#flowPts')?.textContent === '20');
    if (await page.textContent('#flowPts') !== '20') fails.push('segunda foto: no suma puntos');
    await page.click('.flow-step.active .stage-remove');
    if (await page.textContent('#flowPts') !== '10' || !(await page.isVisible('.flow-step.active .stage-user-media'))) fails.push('quitar la foto activa no recupera la anterior');
    await page.click('.flow-step.active .stage-remove');
    const emptyStage = await page.evaluate(() => ({ points:document.querySelector('#flowPts')?.textContent, media:!!document.querySelector('.flow-step.active .stage-user-media'), hasMedia:document.querySelector('.flow-step.active')?.classList.contains('has-media') }));
    if (emptyStage.points !== '0' || emptyStage.media || emptyStage.hasMedia) fails.push(`quitar la última foto no recupera el placeholder ${JSON.stringify(emptyStage)}`);
    await page.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
    await page.waitForTimeout(80);
    await page.click('.flow-step.active .step-continue'); await waitCurtain(page);
    for (let i = 0; i < 3; i++) { await page.click('.flow-step.active .step-secondary'); await waitCurtain(page); }

    await page.locator('#stars button').nth(4).click();
    const ratingReward = await page.evaluate(() => ({
      live: document.querySelector('#rewardLive')?.textContent,
      randomVisuals: document.querySelectorAll('.reward-moment,.reward-flight').length,
      local: document.querySelector('.experience-step')?.classList.contains('rating-reward'),
      sameStep: document.querySelector('.flow-step.active')?.dataset.flowStep,
      audioVisible: getComputedStyle(document.querySelector('#experienceAudio')).display !== 'none',
      textHidden: getComputedStyle(document.querySelector('#experienceText')).display === 'none',
    }));
    if (!ratingReward.live?.includes('5 puntos') || ratingReward.randomVisuals !== 0 || !ratingReward.local || ratingReward.sameStep !== 'experience' || !ratingReward.audioVisible || !ratingReward.textHidden) fails.push(`estrellas: audio no se revela en contexto ${JSON.stringify(ratingReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '15') fails.push(`estrellas: esperaba 15 puntos, hay ${pts}`);
    await page.evaluate(() => renderAudio('recording'));
    const mobileRecording = await page.evaluate(() => {
      const stop = document.querySelector('#recStop');
      const content = document.querySelector('.experience-audio');
      return {
        stopWidth: Math.round(stop.getBoundingClientRect().width),
        contentWidth: Math.round(content.getBoundingClientRect().width),
        actionsHidden: getComputedStyle(document.querySelector('.experience-step .experience-actions')).display === 'none',
        rootBackground: getComputedStyle(document.documentElement).backgroundColor,
      };
    });
    if (mobileRecording.stopWidth < mobileRecording.contentWidth - 40 || !mobileRecording.actionsHidden || mobileRecording.rootBackground === 'rgba(0, 0, 0, 0)') fails.push(`audio mobile: jerarquía o fondo incorrectos ${JSON.stringify(mobileRecording)}`);
    await page.screenshot({ path: `${OUT}/canonical-390-audio-recording.png` });
    await page.evaluate(() => renderAudio('idle'));
    await page.click('#audioSkip');
    await page.waitForTimeout(520);
    const experienceHierarchy = await page.evaluate(() => {
      const cta = document.querySelector('#experienceNext'), text = document.querySelector('#experienceText');
      const rect = cta.getBoundingClientRect(), label = document.querySelector('.text-reward-label');
      return {
        focused:document.activeElement === cta,
        visible:rect.top >= 0 && rect.bottom <= innerHeight,
        beforeText:Boolean(cta.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING),
        position:getComputedStyle(cta.parentElement).position,
        labelColor:getComputedStyle(label).color,
        helperColor:getComputedStyle(document.querySelector('.experience-prompt span')).color,
        textDivider:getComputedStyle(text.querySelector('.experience-divider')).display,
      };
    });
    if (!experienceHierarchy.focused || !experienceHierarchy.visible || !experienceHierarchy.beforeText || experienceHierarchy.position !== 'static' ||
        experienceHierarchy.labelColor !== experienceHierarchy.helperColor || experienceHierarchy.textDivider !== 'none') {
      fails.push(`experiencia: el CTA no recibe foco antes del texto opcional ${JSON.stringify(experienceHierarchy)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-experience-cta.png` });
    await page.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
    const textReward = await page.evaluate(() => ({
      live: document.querySelector('#rewardLive')?.textContent,
      randomVisuals: document.querySelectorAll('.reward-moment,.reward-flight').length,
      local: document.querySelector('.experience-step')?.classList.contains('text-reward'),
      sameStep: document.querySelector('.flow-step.active')?.dataset.flowStep,
    }));
    if (!textReward.live?.includes('5 puntos') || textReward.randomVisuals !== 0 || !textReward.local || textReward.sameStep !== 'experience') fails.push(`texto: recompensa incompleta ${JSON.stringify(textReward)}`);
    pts = await page.textContent('#flowPts');
    if (pts !== '20') fails.push(`texto: esperaba 20 puntos, hay ${pts}`);
    await page.click('#experienceNext'); await waitCurtain(page);

    const confirmBefore = await page.evaluate(() => ({
      authorized: document.querySelector('.confirm-step').classList.contains('is-authorized'),
      redundantSubmit: Boolean(document.querySelector('#submitBtn')),
      rollers: document.querySelectorAll('.confirm-step .celebration-roller').length,
      prizes: document.querySelectorAll('.confirm-step .confirm-world img').length,
      videos: document.querySelectorAll('.confirm-step .confirm-world video').length,
      proof: document.querySelector('#confirmProof').textContent,
      consentBg: getComputedStyle(document.querySelector('#confirmParticipation')).backgroundColor,
      fabricatedAverage: /promedio|veces más que/i.test(document.querySelector('.confirm-step').innerText),
      concretePrizes: document.querySelector('.confirm-prize-reminder')?.textContent,
      scoreBackground: getComputedStyle(document.querySelector('#flowScore')).backgroundColor,
      compactHeader: [...document.querySelectorAll('#flowScore>span,#flowScore>i')].every(element => getComputedStyle(element).opacity === '0'),
      headerBackground: getComputedStyle(document.querySelector('.flow-head')).backgroundColor,
      persistentRollers: document.querySelectorAll('.score-roller,.roller-chain').length,
      hero: {
        src: document.querySelector('.confirm-prize-base')?.getAttribute('src'),
        current: document.querySelector('.confirm-prize-base')?.currentSrc,
        video: document.querySelector('.confirm-world video')?.currentSrc,
      },
    }));
    if (confirmBefore.authorized || confirmBefore.redundantSubmit || confirmBefore.rollers !== 3 || confirmBefore.prizes !== 1 || confirmBefore.videos !== 1 ||
        confirmBefore.proof !== 'Cada chance participa por separado.' || confirmBefore.fabricatedAverage || !confirmBefore.concretePrizes?.includes('3 almohadones y 2 alfombras premium') ||
        confirmBefore.scoreBackground !== 'rgba(0, 0, 0, 0)' || !confirmBefore.compactHeader || confirmBefore.headerBackground !== 'rgba(0, 0, 0, 0)' || confirmBefore.persistentRollers !== 0 || !confirmBefore.hero.src?.includes('scene-02-textile-editorial-desktop') ||
        !confirmBefore.hero.current?.includes('scene-02-textile-editorial-mobile') || !confirmBefore.hero.video?.includes('scene-02-mobile') || confirmBefore.hero.video?.includes('desktop') ||
        !['rgb(198, 58, 33)','rgb(151, 41, 15)'].includes(confirmBefore.consentBg)) {
      fails.push(`confirmación inicial: jerarquía o evidencia incorrecta ${JSON.stringify(confirmBefore)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-confirm-consent.png` });
    if (await page.evaluate(() => document.body.classList.contains('done'))) fails.push('el flujo terminó antes del consentimiento');
    await page.click('#confirmParticipation'); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/canonical-390-thanks-curtain.png` });
    const earlyFinale = await page.evaluate(() => {
      const video=document.querySelector('#thanksAmbientVideo'), curtain=document.querySelector('.gr-curtain-reveal i');
      return {
        videoTime:video.currentTime,
        videoOpacity:parseFloat(getComputedStyle(video).opacity),
        curtainTransform:getComputedStyle(curtain).transform,
        scoreOpacity:parseFloat(getComputedStyle(document.querySelector('.gr-chances')).opacity),
        particles:window.__celebrationState?.particles || 0,
        timing:window.__finaleTiming,
        flash:document.querySelector('#celebrationFlash').classList.contains('burst'),
      };
    });
    if (earlyFinale.videoTime <= .2 || earlyFinale.videoOpacity < .5 || earlyFinale.curtainTransform === 'matrix(1, 0, 0, 0, 0, 0)' ||
        earlyFinale.scoreOpacity < .2 || earlyFinale.particles !== 0 || !earlyFinale.timing?.videoStarted || earlyFinale.timing?.burst || earlyFinale.flash) {
      fails.push(`festejo temprano: video, trama y números no conviven antes del confeti ${JSON.stringify(earlyFinale)}`);
    }
    await page.waitForTimeout(2600);
    if (!(await page.evaluate(() => document.body.classList.contains('done')))) fails.push('no llegó a gracias');
    if (await page.isVisible('body > .hero') || await page.isVisible('body > .mecanica-sec')) fails.push('la landing larga reaparece antes del agradecimiento');
    if (await page.textContent('#grPts') !== '20') fails.push('gracias no muestra 20 puntos');
    const celebration = await page.evaluate(() => {
      const chance = document.querySelector('.gr-chances strong');
      const points = document.querySelector('.gr-points strong');
      const chanceSurface = getComputedStyle(document.querySelector('.gr-chances'));
      const layer = document.querySelector('#celebrationLayer');
      const curtain = document.querySelector('.gr-curtain-reveal i');
      const curtainStyle = getComputedStyle(curtain);
      return {
        title: document.querySelector('#thanksTitle')?.textContent,
        sub: document.querySelector('#grSub')?.textContent,
        chanceSize: parseFloat(getComputedStyle(chance).fontSize),
        pointsSize: parseFloat(getComputedStyle(points).fontSize),
        chanceColor: getComputedStyle(chance).color,
        pointsColor: getComputedStyle(points).color,
        surface: chanceSurface.backgroundColor,
        border: chanceSurface.borderTopWidth,
        celebrationWidth: layer.clientWidth,
        particles: window.__celebrationState?.particles || 0,
        running: window.__celebrationState?.running || false,
        numberMotion: getComputedStyle(chance).animationName,
        oldConfetti: document.querySelectorAll('.confetti').length,
        curtainColor: curtainStyle.backgroundColor,
        curtainTexture: curtainStyle.backgroundImage,
        curtainFiber: getComputedStyle(curtain, '::after').backgroundImage,
        curtainBlur: curtainStyle.backdropFilter || curtainStyle.webkitBackdropFilter,
        videoTime: document.querySelector('#thanksAmbientVideo').currentTime,
        videoPaused: document.querySelector('#thanksAmbientVideo').paused,
        videoLoop: document.querySelector('#thanksAmbientVideo').loop,
        videoOpacity: parseFloat(getComputedStyle(document.querySelector('#thanksAmbientVideo')).opacity),
        videoFilter: getComputedStyle(document.querySelector('#thanksAmbientVideo')).filter,
        videoBlend: getComputedStyle(document.querySelector('#thanksAmbientVideo')).mixBlendMode,
        radiance: getComputedStyle(document.querySelector('.gr-radiance')).display,
        fanfare: window.__participationFanfare,
        sounds: window.__uiSoundEvents,
        finaleTiming: window.__finaleTiming,
        flashTriggered: document.querySelector('#celebrationFlash').classList.contains('burst'),
        videoDrops: (() => { const q=document.querySelector('#thanksAmbientVideo').getVideoPlaybackQuality(); return {dropped:q.droppedVideoFrames,total:q.totalVideoFrames,corrupted:q.corruptedVideoFrames}; })(),
        readingOrder: Boolean(document.querySelector('#gBlock').compareDocumentPosition(document.querySelector('.gr-meta')) & Node.DOCUMENT_POSITION_FOLLOWING),
        lowerDisplay: getComputedStyle(document.querySelector('.gr-lower')).display,
        lowerDirection: getComputedStyle(document.querySelector('.gr-lower')).flexDirection,
      };
    });
    const curtainAlpha = Number(celebration.curtainColor.match(/[\d.]+(?=\))/)?.[0] || 1);
    if (!celebration.title?.includes('ya estás en el sorteo') || !celebration.sub?.includes('duplicá tus puntos') || celebration.chanceSize < 64 || celebration.pointsSize < 64 ||
        celebration.surface !== 'rgba(0, 0, 0, 0)' || celebration.border !== '0px' || celebration.celebrationWidth < 390 || celebration.chanceColor !== celebration.pointsColor ||
        celebration.particles < 18 || celebration.particles > 64 || !celebration.running || celebration.numberMotion !== 'none' || celebration.oldConfetti !== 0 ||
        !celebration.curtainColor.startsWith('rgba') || curtainAlpha < .6 || curtainAlpha > .8 || !celebration.curtainTexture.includes('repeating-linear-gradient') ||
        !celebration.curtainFiber.includes('data:image/svg+xml') || celebration.curtainBlur !== 'none' || celebration.videoTime <= .2 ||
        celebration.videoPaused || !celebration.videoLoop || celebration.videoOpacity < .5 || !celebration.readingOrder ||
        celebration.videoFilter !== 'none' || celebration.videoBlend !== 'normal' || celebration.radiance !== 'none' ||
        !celebration.fanfare?.attempted || !celebration.fanfare?.played || celebration.fanfare.plays !== 1 || celebration.fanfare.volume < .08 || celebration.fanfare.volume > .12 ||
        celebration.fanfare.duration > 1.1 || celebration.fanfare.voices !== 8 || celebration.fanfare.error ||
        celebration.sounds.filter(sound => sound.kind === 'finale').length !== 1 || celebration.sounds.some(sound => !['click','upload','finale'].includes(sound.kind)) ||
        !celebration.sounds.some(sound => sound.kind === 'click') || celebration.sounds.filter(sound => sound.kind === 'click').some(sound =>
          !sound.played || sound.plays !== 1 || sound.volume > .025 || sound.duration > .08 || sound.voices !== 1 || sound.error) ||
        !celebration.finaleTiming?.burst || celebration.finaleTiming.burstAt < 1900 || celebration.finaleTiming.burstAt > 2350 || !celebration.flashTriggered ||
        celebration.videoDrops.corrupted > 0 || (celebration.videoDrops.dropped / Math.max(1,celebration.videoDrops.total)) > .05 ||
        celebration.lowerDisplay !== 'flex' || celebration.lowerDirection !== 'column') {
      fails.push(`festejo final: sigue siendo una confirmación plana o en cards ${JSON.stringify(celebration)}`);
    }
    const googleHandoff = await page.evaluate(() => {
      const button = document.querySelector('#gReviewBtn');
      const url = new URL(button.href);
      return {
        focused: document.activeElement === button,
        highlighted: button.classList.contains('google-focus'),
        buttonRect: { top:button.getBoundingClientRect().top, bottom:button.getBoundingClientRect().bottom },
        introBottom: document.querySelector('#gIntro').getBoundingClientRect().bottom,
        dateTop: document.querySelector('#thanksDrawDate').getBoundingClientRect().top,
        outlineWidth: parseFloat(getComputedStyle(button).outlineWidth),
        outlineOffset: parseFloat(getComputedStyle(button).outlineOffset),
        titleTop: document.querySelector('#thanksTitle').getBoundingClientRect().top,
        chanceTop: document.querySelector('.gr-chances strong').getBoundingClientRect().top,
        metaBottom: document.querySelector('.gr-meta').getBoundingClientRect().bottom,
        scrollY,
        viewportHeight: innerHeight,
        host: url.hostname,
        path: url.pathname,
        href: button.href,
      };
    });
    if (!googleHandoff.focused || !googleHandoff.highlighted || googleHandoff.scrollY !== 0 || googleHandoff.titleTop < 0 ||
        googleHandoff.buttonRect.top < 0 || googleHandoff.buttonRect.bottom > googleHandoff.viewportHeight ||
        googleHandoff.chanceTop < -2 || googleHandoff.metaBottom > googleHandoff.viewportHeight ||
        googleHandoff.buttonRect.top - googleHandoff.introBottom < googleHandoff.outlineWidth + googleHandoff.outlineOffset ||
        googleHandoff.dateTop - googleHandoff.buttonRect.bottom < googleHandoff.outlineWidth + googleHandoff.outlineOffset) {
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
    if (!((await page.textContent('#gValidating')) || '').includes('Actualizando tus puntos')) fails.push('Google no comunica con claridad qué está haciendo');
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
    if (googleDone.icon < 44 || !googleDone.status?.includes('duplicamos tus puntos') || googleDone.title !== 'Tus puntos ya se duplicaron' ||
        !googleDone.instagramCopy?.includes('ver si gané') || !googleDone.instagramHref?.includes('instagram.com/cortinas.rollershow') ||
        !googleDone.instagramFocused || googleDone.instagramWidth < googleDone.blockWidth - 2 || !googleDone.requirement?.includes('31 de julio') ||
        !googleDone.sub?.includes('seguinos en Instagram') ||
        !googleDone.requirement?.includes('requisito') || !googleDone.oldInstagramHidden || !googleDone.completeState ||
        googleDone.orbitA !== 'none' || googleDone.orbitB !== 'none' || googleDone.divider !== 'none') {
      fails.push(`cierre Google: estado o geometría decorativa incorrectos ${JSON.stringify(googleDone)}`);
    }
    await page.screenshot({ path: `${OUT}/canonical-390-google-done.png`, fullPage:true });

    const p2 = await ctx.newPage();
    await p2.goto(URL, { waitUntil: 'domcontentloaded' });
    await p2.click('#startFlow'); await waitCurtain(p2);
    await p2.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
    await p2.waitForFunction(() => document.querySelector('#flowPts')?.textContent === '10');
    await p2.goBack(); await p2.waitForTimeout(500);
    if (!(await p2.evaluate(() => document.getElementById('exitModal').open))) fails.push('exit popup no aparece con puntos cargados');
    await p2.evaluate(async () => { localStorage.removeItem(LS_KEY); await clearPersistedDraft(); });

    const p3 = await ctx.newPage();
    await p3.goto(URL, { waitUntil: 'domcontentloaded' });
    await reachConfirm(p3);
    await p3.click('#openBases');
    if (!(await p3.evaluate(() => document.getElementById('basesModal').open))) fails.push('modal de bases no abre');
  }
  await ctx.close();
}

// Una foto real de teléfono no debe quedar en memoria con resolución y peso originales.
const cctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const cpage = await cctx.newPage();
await cpage.goto(URL, { waitUntil:'domcontentloaded' });
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
await dpage.goto(URL, { waitUntil: 'domcontentloaded' });
await dpage.evaluate(() => window.celebrateAction('audio', { points:30, origin:document.querySelector('#startFlow'), detail:'Audio guardado' }));
const audioReward = await dpage.evaluate(() => ({ randomVisuals:document.querySelectorAll('.reward-moment,.reward-flight').length, live:document.querySelector('#rewardLive')?.textContent, transfer:document.querySelector('.score-transfer')?.textContent }));
if (audioReward.randomVisuals !== 0 || !audioReward.live?.includes('30 puntos') || audioReward.transfer !== '+30') fails.push(`audio: recompensa invocable y accesible incompleta ${JSON.stringify(audioReward)}`);
await dpage.waitForTimeout(950);
await dpage.screenshot({ path: `${OUT}/canonical-1280-intro.png` });
const desktopIntro = await dpage.evaluate(() => {
  const copy = document.querySelector('.intro-copy-block').getBoundingClientRect();
  const prizeElement = document.querySelector('.intro-prize-photo');
  const prize = prizeElement.getBoundingClientRect();
  const prizeStyle = getComputedStyle(prizeElement);
  const cta = document.querySelector('#startFlow').getBoundingClientRect();
  const note = document.querySelector('#introSaveNote').getBoundingClientRect();
  return {
    prizeVisible:prizeStyle.display !== 'none',
    cutout:prizeStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && prizeStyle.borderTopLeftRadius === '0px' && prizeStyle.overflow === 'visible',
    split:copy.right < prize.left,
    ctaInside:cta.left >= copy.left && cta.right <= copy.right && cta.bottom <= innerHeight - 12,
    noteAligned:Math.abs(note.left-cta.left) < 2 && note.right <= cta.right + 1,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  };
});
if (!desktopIntro.prizeVisible || !desktopIntro.cutout || !desktopIntro.split || !desktopIntro.ctaInside || !desktopIntro.noteAligned || desktopIntro.overflow > 0) fails.push(`portada desktop: relato y premios no forman dos zonas legibles ${JSON.stringify(desktopIntro)}`);
await dpage.click('#startFlow'); await waitCurtain(dpage);
await dpage.screenshot({ path: `${OUT}/canonical-1280-item.png` });
const desktopUploadAxis = await dpage.evaluate(() => {
  const step=document.querySelector('.item-step.active'), prompt=step.querySelector('.upload-prompt').getBoundingClientRect();
  const source=step.querySelector('.upload-library').getBoundingClientRect(), skip=step.querySelector('.stage-skip').getBoundingClientRect(), title=step.querySelector('.upload-prompt strong').getBoundingClientRect();
  return {prompt:{left:prompt.left,right:prompt.right,width:prompt.width,bottom:prompt.bottom},source:{left:source.left,right:source.right,height:source.height},skip:{left:skip.left,top:skip.top},title:{left:title.left},stageRight:step.querySelector('.item-stage').getBoundingClientRect().right};
});
if (desktopUploadAxis.prompt.width > 282 || desktopUploadAxis.source.height < 40 ||
    desktopUploadAxis.source.left < desktopUploadAxis.prompt.left || desktopUploadAxis.source.right > desktopUploadAxis.prompt.right ||
    desktopUploadAxis.skip.top - desktopUploadAxis.prompt.bottom < 18 || Math.abs(desktopUploadAxis.prompt.right-desktopUploadAxis.stageRight) > 26 ||
    Math.abs(desktopUploadAxis.title.left-desktopUploadAxis.source.left) > 2 || Math.abs(desktopUploadAxis.title.left-desktopUploadAxis.skip.left) > 2) {
  fails.push(`carga desktop: selector poco claro, grande o mal separado ${JSON.stringify(desktopUploadAxis)}`);
}
await dpage.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
await dpage.waitForTimeout(620);
const desktopTray = await dpage.evaluate(() => {
  const stage = document.querySelector('.item-step.active .item-stage').getBoundingClientRect();
  const actions = document.querySelector('.item-step.active .step-actions').getBoundingClientRect();
  const primary = document.querySelector('.item-step.active .step-continue').getBoundingClientRect();
  const secondary = document.querySelector('.item-step.active .upload-more-action').getBoundingClientRect();
  const center = rect => (rect.left + rect.right) / 2;
  return {
    attached: Math.abs(stage.bottom - actions.top) < 2,
    sameLeft: Math.abs(stage.left - actions.left) < 2,
    sameRight: Math.abs(stage.right - actions.right) < 2,
    primaryInside: primary.left >= actions.left && primary.right <= actions.right,
    sharedAxis: Math.abs(center(primary) - center(secondary)) < 2,
    centered: Math.abs(center(primary) - center(actions)) < 2,
    stacked: secondary.top >= primary.bottom - 1,
  };
});
if (!desktopTray.attached || !desktopTray.sameLeft || !desktopTray.sameRight || !desktopTray.primaryInside || !desktopTray.sharedAxis || !desktopTray.centered || !desktopTray.stacked) fails.push(`foto desktop: acciones desligadas o sin eje común ${JSON.stringify(desktopTray)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-photo-reward.png` });

// Audio: durante la grabación, detener es la única acción dominante. Detener no avanza.
await dpage.click('.flow-step.active .step-continue'); await waitCurtain(dpage);
for (let i = 0; i < 3; i++) { await dpage.click('.flow-step.active .step-secondary'); await waitCurtain(dpage); }
await dpage.locator('#stars button').nth(4).click();
if (!((await dpage.textContent('#recStart')) || '').includes('+30 puntos')) fails.push('grabar audio no recuerda que suma 30 puntos');
await dpage.click('#recStart');
await dpage.waitForTimeout(450);
const recordingState = await dpage.evaluate(() => {
  const step = document.querySelector('.experience-step');
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
    stopColor: getComputedStyle(stop).backgroundColor,
  };
});
if (!recordingState.recording || recordingState.stopCopy !== 'Terminar y guardar (+30 puntos)' || recordingState.stopWidth < recordingState.contentWidth - 40 ||
    recordingState.skipVisible || recordingState.activeStep !== 'experience' || !recordingState.liveAnalyser || !recordingState.liveBars || recordingState.simulatedCss ||
    recordingState.stopColor !== 'rgb(20, 122, 58)') fails.push(`audio grabando: jerarquía, color u onda real incorrecta ${JSON.stringify(recordingState)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-audio-recording.png` });

await dpage.locator('#recStop').click({ force:true });
await dpage.waitForTimeout(700);
const reviewState = await dpage.evaluate(() => {
  const cta = document.querySelector('#experienceNext');
  const text = document.querySelector('#experienceText');
  const ctaRect = cta.getBoundingClientRect();
  return ({
  recorded: document.querySelector('.experience-step')?.classList.contains('has-audio'),
  recording: document.querySelector('.experience-step')?.classList.contains('is-recording'),
  player: !!document.querySelector('.voice-note'),
  rerecord: !!document.querySelector('#reRec'),
  remove: !!document.querySelector('#delRec'),
  textVisible: getComputedStyle(document.querySelector('#experienceText')).display !== 'none',
  continueVisible: getComputedStyle(document.querySelector('#experienceNext')).display !== 'none',
  skipVisible: getComputedStyle(document.querySelector('.step-audio-skip')).display !== 'none',
  earned: document.querySelector('.audio-earned')?.innerText,
  points: document.querySelector('#flowPts')?.textContent,
  transfer: document.querySelector('.score-transfer')?.textContent,
  ctaFocused: document.activeElement === cta,
  ctaHighlighted: cta.classList.contains('handoff-focus'),
  ctaVisible: ctaRect.top >= 0 && ctaRect.bottom <= innerHeight,
  ctaWidth: Math.round(ctaRect.width),
  ctaBeforeText: Boolean(cta.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING),
  ctaCopy: cta.textContent.trim(),
  });
});
if (!reviewState.recorded || reviewState.recording || !reviewState.player || !reviewState.rerecord || !reviewState.remove ||
    !reviewState.textVisible || !reviewState.continueVisible || reviewState.skipVisible || !reviewState.earned?.includes('+30 puntos') || reviewState.points !== '45' || reviewState.transfer !== '+30' ||
    !reviewState.ctaFocused || !reviewState.ctaHighlighted || !reviewState.ctaVisible || reviewState.ctaWidth > 300 || !reviewState.ctaBeforeText || reviewState.ctaCopy !== 'Continuar →') fails.push(`audio detenido: opinión, foco o recompensa incompleta ${JSON.stringify(reviewState)}`);
await dpage.screenshot({ path: `${OUT}/canonical-1280-audio-review.png` });
await dpage.setViewportSize({ width:390, height:700 });
await dpage.evaluate(() => syncExperienceProgress({ revealText:true }));
await dpage.waitForTimeout(700);
const mobileAudioHandoff = await dpage.evaluate(() => {
  const cta = document.querySelector('#experienceNext');
  const rect = cta.getBoundingClientRect();
  return { focused:document.activeElement === cta, highlighted:cta.classList.contains('handoff-focus'), visible:rect.top >= 0 && rect.bottom <= innerHeight };
});
if (!mobileAudioHandoff.focused || !mobileAudioHandoff.highlighted || !mobileAudioHandoff.visible) fails.push(`audio mobile: el CTA no recibe el foco al guardar ${JSON.stringify(mobileAudioHandoff)}`);
await dpage.screenshot({ path: `${OUT}/canonical-390-audio-review.png` });
await dpage.setViewportSize({ width:1280, height:800 });
await dpage.fill('#reviewText', 'Excelente atención, quedaron hermosas las cortinas del living.');
await dpage.click('#experienceNext'); await waitCurtain(dpage);
await dpage.screenshot({ path: `${OUT}/canonical-1280-confirm-consent.png` });
await dpage.click('#confirmParticipation'); await dpage.waitForTimeout(1800);
await dpage.screenshot({ path: `${OUT}/canonical-1280-thanks-entry.png`, fullPage:true });
await dpage.waitForTimeout(1500);
await dpage.screenshot({ path: `${OUT}/canonical-1280-thanks.png`, fullPage:true });
const desktopThanksHierarchy = await dpage.evaluate(() => {
  const copy = document.querySelector('.gr-copy').getBoundingClientRect();
  const score = document.querySelector('.gr-score').getBoundingClientRect();
  const lower = document.querySelector('.gr-lower').getBoundingClientRect();
  const google = document.querySelector('#gBlock').getBoundingClientRect();
  const meta = document.querySelector('.gr-meta').getBoundingClientRect();
  const chances = document.querySelector('.gr-chances strong').getBoundingClientRect();
  const points = document.querySelector('.gr-points strong').getBoundingClientRect();
  return {
    sharedAxis: Math.max(Math.abs(copy.left-score.left),Math.abs(copy.left-lower.left)) < 2,
    boundedMeasure: copy.width <= 682 && score.width <= 682 && lower.width <= 682,
    scoreGrouped: points.left > chances.right && points.right <= score.right + 1,
    chanceDominates: chances.height > points.height * 1.25,
    googleBelowScore: google.top >= score.bottom - 1,
    metaBelowGoogle: meta.top >= google.bottom - 1,
    lowerDirection: getComputedStyle(document.querySelector('.gr-lower')).flexDirection,
  };
});
if (!desktopThanksHierarchy.sharedAxis || !desktopThanksHierarchy.boundedMeasure || !desktopThanksHierarchy.scoreGrouped || !desktopThanksHierarchy.chanceDominates ||
    !desktopThanksHierarchy.googleBelowScore || !desktopThanksHierarchy.metaBelowGoogle || desktopThanksHierarchy.lowerDirection !== 'column') {
  fails.push(`gracias desktop: la lectura no conserva un único eje narrativo ${JSON.stringify(desktopThanksHierarchy)}`);
}
await dpage.evaluate(() => {
  document.querySelector('#gIntro').style.display='none';
  document.querySelector('#gReviewBtn').hidden=true;
  document.querySelector('#gConfirmStep').hidden=true;
  document.querySelector('#gDone').hidden=false;
  document.body.classList.add('google-complete');
  document.querySelector('#gTitle').textContent='Tus puntos ya se duplicaron';
  document.querySelector('#grTickets').textContent='17'; document.querySelector('#grTickets').dataset.value='17';
  document.querySelector('#grPts').textContent='170'; document.querySelector('#grPts').dataset.value='170';
});
await dpage.waitForTimeout(700);
await dpage.screenshot({ path: `${OUT}/canonical-1280-google-done.png`, fullPage:true });
await dctx.close();

// Borrador completo: una recarga debe reconstruir paso, foto, audio, estrellas y texto.
const persistCtx = await browser.newContext({
  viewport: { width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2,
  permissions:['microphone'],
});
const persistPage = await persistCtx.newPage();
await persistPage.goto(URL, { waitUntil:'domcontentloaded' });
await persistPage.evaluate(() => window.__draftReady);
await persistPage.click('#startFlow'); await waitCurtain(persistPage);
await persistPage.locator('.flow-step.active .item-task .upload-library input[type=file]').setInputFiles(testImage);
await persistPage.waitForTimeout(500);
await persistPage.click('.flow-step.active .step-continue'); await waitCurtain(persistPage);
for (let i = 0; i < 3; i++) { await persistPage.click('.flow-step.active .step-secondary'); await waitCurtain(persistPage); }
await persistPage.locator('#stars button').nth(4).click();
await persistPage.click('#recStart'); await persistPage.waitForTimeout(450);
await persistPage.locator('#recStop').click({ force:true }); await persistPage.waitForTimeout(800);
await persistPage.fill('#reviewText', 'Excelente atenciÃ³n y muy buen resultado final.');
await persistPage.waitForTimeout(250);
await persistPage.reload({ waitUntil:'domcontentloaded' });
await persistPage.evaluate(() => window.__draftReady);
const restoredDraft = await persistPage.evaluate(() => ({
  activeStep:document.querySelector('.flow-step.active')?.dataset.flowStep,
  photoCount:state.archivos[1]?.length || 0,
  photoPreview:!!document.querySelector('.item-step[data-item-id="1"] .stage-user-media'),
  stars:state.estrellas,
  audioBlob:state.audioBlob instanceof Blob && state.audioBlob.size > 0,
  audioPlayer:!!document.querySelector('.experience-step .voice-note'),
  text:document.querySelector('#reviewText')?.value,
  textVisible:document.querySelector('.experience-step')?.classList.contains('show-text'),
  points:document.querySelector('#flowPts')?.textContent,
}));
if (restoredDraft.activeStep !== 'experience' || restoredDraft.photoCount !== 1 || !restoredDraft.photoPreview ||
    restoredDraft.stars !== 5 || !restoredDraft.audioBlob || !restoredDraft.audioPlayer ||
    restoredDraft.text !== 'Excelente atenciÃ³n y muy buen resultado final.' || !restoredDraft.textVisible || restoredDraft.points !== '50') {
  fails.push(`persistencia: el borrador no se reconstruyÃ³ completo ${JSON.stringify(restoredDraft)}`);
}
await persistPage.evaluate(async () => { localStorage.removeItem(LS_KEY); await clearPersistedDraft(); });
await persistCtx.close();

// Regresión: calificar sin escribir comentario suma sólo los 5 puntos de las estrellas.
const noTextCtx = await browser.newContext({ viewport:{ width:390,height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const noTextPage = await noTextCtx.newPage();
const noTextUrl = new globalThis.URL(URL); noTextUrl.searchParams.set('t', `sin-comentario-${Date.now()}`);
await noTextPage.goto(noTextUrl.href, { waitUntil:'domcontentloaded' });
await noTextPage.evaluate(() => window.__draftReady);
await noTextPage.click('#startFlow'); await waitCurtain(noTextPage);
for (let index=0; index<4; index++) { await noTextPage.click('.flow-step.active .stage-skip'); await waitCurtain(noTextPage); }
await noTextPage.locator('#stars button').nth(4).click();
await noTextPage.click('#audioSkip'); await noTextPage.waitForTimeout(520);
const noTextBefore = await noTextPage.evaluate(() => ({ text:reviewText.value,valid:textoValido(),flag:state.textoOk,points:totalPuntos(),shown:document.querySelector('#flowPts')?.textContent }));
await noTextPage.click('#experienceNext'); await waitCurtain(noTextPage);
const noTextConfirm = await noTextPage.evaluate(() => ({ points:document.querySelector('#confirmPts')?.textContent,chances:document.querySelector('#confirmTickets')?.textContent }));
await noTextPage.click('#confirmParticipation'); await noTextPage.waitForTimeout(120);
const noTextThanks = await noTextPage.textContent('#grPts');
if (noTextBefore.text !== '' || noTextBefore.valid || noTextBefore.flag || noTextBefore.points !== 5 || noTextBefore.shown !== '5' ||
    noTextConfirm.points !== '5' || noTextConfirm.chances !== '1' || noTextThanks !== '5') {
  fails.push(`sin comentario: se acreditaron puntos que no corresponden ${JSON.stringify({ noTextBefore,noTextConfirm,noTextThanks })}`);
}
await noTextCtx.close();

// Regresión: un borrador de otro token o de la clave global anterior no puede contaminar al participante actual.
const scopeCtx = await browser.newContext({ viewport:{ width:390,height:844 } });
const scopePage = await scopeCtx.newPage();
const scopeA = new globalThis.URL(URL); scopeA.searchParams.set('t','participante-a');
await scopePage.goto(scopeA.href, { waitUntil:'domcontentloaded' });
await scopePage.evaluate(() => {
  const saved={ v:2,e:5,t:'Comentario anterior suficientemente largo',audioSkipped:true,textoVisible:true,step:5 };
  localStorage.setItem(LS_KEY,JSON.stringify(saved));
  localStorage.setItem('rs-experiencia',JSON.stringify(saved));
});
const keyA = await scopePage.evaluate(() => LS_KEY);
const scopeB = new globalThis.URL(URL); scopeB.searchParams.set('t','participante-b');
await scopePage.goto(scopeB.href, { waitUntil:'domcontentloaded' });
await scopePage.evaluate(() => window.__draftReady);
const isolatedDraft = await scopePage.evaluate(() => ({ key:LS_KEY,legacy:localStorage.getItem('rs-experiencia') !== null,text:reviewText.value,stars:state.estrellas,points:totalPuntos(),active:document.querySelector('.flow-step.active')?.dataset.flowStep }));
if (isolatedDraft.key === keyA || !isolatedDraft.legacy || isolatedDraft.text !== '' || isolatedDraft.stars !== 0 || isolatedDraft.points !== 0 || isolatedDraft.active !== 'intro') {
  fails.push(`persistencia: un participante heredó el borrador de otro ${JSON.stringify({ keyA,isolatedDraft })}`);
}
await scopePage.evaluate(() => { localStorage.removeItem(LS_KEY); localStorage.removeItem('rs-experiencia'); });
await scopeCtx.close();

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: multistep, recompensas foto/estrellas/audio/texto, puntos, consentimiento, gracias, Google, exit y bases');
