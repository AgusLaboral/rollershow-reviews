// Verifica el gesto único: material sunscreen, profundidad y grid maestro.
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const fails = [];

for (const variant of ['ambientes']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${BASE}?v=${variant}`, { waitUntil: 'networkidle' });
  const idleRoller = await page.evaluate(() => document.querySelector('.score-roller').getBoundingClientRect().width);
  await page.click('#startFlow');
  await page.waitForTimeout(220);
  const motion = await page.evaluate(() => {
    const incoming = document.querySelector('.flow-step.active');
    const outgoing = document.querySelector('.flow-step.leaving');
    const read = element => element ? {
      step: element.dataset.flowStep,
      transform: getComputedStyle(element).transform,
      filter: getComputedStyle(element).filter,
      opacity: getComputedStyle(element).opacity,
    } : null;
    const roller = document.querySelector('.roller-wipe');
    const fabric = document.querySelector('.roller-fabric');
    const scoreRoller = document.querySelector('.score-roller');
    const heading = document.querySelector('.flow-step.active .item-heading');
    const visual = document.querySelector('.flow-step.active .item-visual');
    const task = document.querySelector('.flow-step.active .item-task');
    incoming.classList.add('entering');
    const stagger = [heading, visual, task].map(element => ({
      opacity:getComputedStyle(element).opacity,
      transform:getComputedStyle(element).transform,
      delay:getComputedStyle(element).transitionDelay,
    }));
    incoming.classList.remove('entering');
    return {
      incoming: read(incoming),
      outgoing: read(outgoing),
      stagger,
      roller: {
        visible: getComputedStyle(roller).visibility,
        transform: getComputedStyle(fabric).transform,
        duration: getComputedStyle(fabric).animationDuration,
        keyframes: fabric.getAnimations()[0]?.effect.getKeyframes().map(frame => ({ offset: frame.offset, easing: frame.easing, transform: frame.transform })),
        background: getComputedStyle(fabric).backgroundImage,
        color: getComputedStyle(fabric).backgroundColor,
        noise: getComputedStyle(fabric, '::after').backgroundImage,
      },
      scoreRoller: {
        width:scoreRoller.getBoundingClientRect().width,
        height:scoreRoller.getBoundingClientRect().height,
        right:scoreRoller.getBoundingClientRect().right,
        wipeLeft:roller.getBoundingClientRect().left,
        wipeRight:roller.getBoundingClientRect().right,
        material:getComputedStyle(scoreRoller).backgroundImage,
        animation:scoreRoller.getAnimations()[0]?.animationName,
        keyframes:scoreRoller.getAnimations()[0]?.effect.getKeyframes().length || 0,
      },
    };
  });
  await page.screenshot({ path:'C:/Users/Agus/Desktop/rollershow-reviews/_scratch/canonical-1280-roller-deploy.png' });
  if (!motion.incoming || !motion.outgoing) fails.push(`${variant}: las dos escenas no coexisten durante la transición`);
  if (motion.incoming?.transform === 'none' || motion.outgoing?.transform === 'none') fails.push(`${variant}: transición sin desplazamiento físico`);
  if (motion.incoming?.transform === motion.outgoing?.transform) fails.push(`${variant}: entrada y salida usan el mismo plano`);
  const scaleOf = transform => Number(transform?.match(/^matrix\(([^,]+)/)?.[1] || 1);
  if (scaleOf(motion.incoming?.transform) < .88 || scaleOf(motion.outgoing?.transform) > 1.09) {
    fails.push(`${variant}: la profundidad vuelve a usar escalas bruscas ${JSON.stringify({ incoming:motion.incoming?.transform, outgoing:motion.outgoing?.transform })}`);
  }
  if (motion.stagger.some(part => part.transform === 'none') || motion.stagger[1]?.delay === motion.stagger[2]?.delay) {
    fails.push(`${variant}: heading, ambiente y tarea no entran con escalonamiento sano ${JSON.stringify(motion.stagger)}`);
  }
  if (motion.roller.visible !== 'visible' || motion.roller.transform === 'none') fails.push(`${variant}: falta la cortina roller`);
  if (!motion.roller.noise.includes('data:image/svg+xml') || !motion.roller.color.startsWith('rgba')) {
    fails.push(`${variant}: el material no combina transparencia y microtextura ${JSON.stringify(motion.roller)}`);
  }
  if (motion.roller.duration !== '1.2s' || motion.roller.keyframes?.length < 5 || !motion.roller.keyframes?.[0]?.easing.includes('cubic-bezier')) {
    fails.push(`${variant}: la bajada no conserva el arranque lento y la aceleración ${JSON.stringify(motion.roller.keyframes)}`);
  }
  if (Math.abs(idleRoller - (motion.scoreRoller.wipeRight - motion.scoreRoller.wipeLeft)) > 2 || Math.abs(motion.scoreRoller.width - idleRoller) > 2 || motion.scoreRoller.height < 8 ||
      !motion.scoreRoller.material.includes('linear-gradient') || motion.scoreRoller.animation !== 'scoreRollDeploy' || motion.scoreRoller.keyframes < 4 ||
      Math.abs(motion.scoreRoller.right - motion.scoreRoller.wipeRight) > 2) {
    fails.push(`${variant}: el roller persistente no se despliega como origen físico ${JSON.stringify({ idleRoller, ...motion.scoreRoller })}`);
  }
  await page.waitForTimeout(1250);
  const settled = await page.evaluate(() => ({
    active: document.querySelectorAll('.flow-step.active').length,
    leaving: document.querySelectorAll('.flow-step.leaving').length,
    step: document.querySelector('.flow-step.active')?.dataset.flowStep,
    curtainRunning: document.querySelector('#flowApp').classList.contains('curtain-running'),
  }));
  if (settled.active !== 1 || settled.leaving !== 0 || settled.step !== 'item-1' || settled.curtainRunning) fails.push(`${variant}: la transición no termina limpia`);
  console.log(`${variant}: cortina ${motion.roller.transform}, entrada ${motion.incoming?.transform}, salida ${motion.outgoing?.transform}`);
  await page.close();
}

const heroPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await heroPage.goto(BASE, { waitUntil: 'networkidle' });
await heroPage.waitForTimeout(2200);
const heroMotion = await heroPage.evaluate(() => {
  const video = document.querySelector('.intro-step [data-scene-video]');
  return {
    count: document.querySelectorAll('.intro-step [data-scene-video]').length,
    src: video?.currentSrc,
    currentTime: video?.currentTime || 0,
    readyState: video?.readyState || 0,
    loop: video?.loop,
    visible: getComputedStyle(video).opacity,
  };
});
if (heroMotion.count !== 1 || !heroMotion.src?.includes('scene-01-desktop') || heroMotion.currentTime <= .15 || heroMotion.readyState < 2 || heroMotion.loop || heroMotion.visible !== '1') {
  fails.push(`portada: el fondo cinematográfico no reproduce o no se asienta correctamente ${JSON.stringify(heroMotion)}`);
}
await heroPage.close();

const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(BASE, { waitUntil: 'networkidle' });
await reducedPage.click('#startFlow');
await reducedPage.waitForTimeout(60);
const reduced = await reducedPage.evaluate(() => ({
  visible: getComputedStyle(document.querySelector('.roller-wipe')).visibility,
  duration: getComputedStyle(document.querySelector('.roller-fabric')).animationDuration,
}));
if (reduced.visible !== 'visible' || reduced.duration !== '0.74s') fails.push(`reduced-motion: coreografía alternativa ausente ${JSON.stringify(reduced)}`);
await reducedContext.close();

for (const width of [1024, 1280, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}?v=ambientes`, { waitUntil: 'networkidle' });
  await page.click('#startFlow');
  await page.waitForTimeout(1300);
  const grid = await page.evaluate(() => {
    const bounds = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: Math.round(rect.left), right: Math.round(rect.right) };
    };
    return { head: bounds('.flow-head'), rail: bounds('.flow-rail'), content: bounds('.flow-step.active .step-inner') };
  });
  const aligned = Math.abs(grid.head.left - grid.rail.left) <= 1 && Math.abs(grid.head.right - grid.rail.right) <= 1 &&
    Math.abs(grid.head.left - grid.content.left) <= 1 && Math.abs(grid.head.right - grid.content.right) <= 1;
  if (!aligned) fails.push(`${width}px: header, progreso y contenido no comparten el grid ${JSON.stringify(grid)}`);
  console.log(`${width}px: grid ${grid.head.left}-${grid.head.right}`);
  await page.close();
}

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: cortina roller sunscreen, profundidad, coexistencia de escenas y grid maestro verificados');
