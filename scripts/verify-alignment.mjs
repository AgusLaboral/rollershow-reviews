// Verifica el grid maestro en todas las etapas, no sólo en la portada.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const fails = [];
const viewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1165, height: 674 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  const report = await page.evaluate(() => {
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
    };
    const steps = [...document.querySelectorAll('.flow-step')];
    steps.forEach(step => { step.style.transition = 'none'; });
    const activate = target => {
      steps.forEach(step => {
        step.classList.toggle('active', step === target);
        step.classList.remove('entering', 'leaving');
      });
      void target.offsetWidth;
    };
    const readStep = step => {
      activate(step);
      const inner = step.querySelector('.step-inner');
      const content = step.querySelector('.step-content');
      const stage = step.querySelector('.item-stage');
      const visual = step.querySelector('.item-visual');
      const task = step.querySelector('.item-task');
      const card = step.querySelector('.curtain-card');
      const upload = step.querySelector('.upload-zone');
      const secondary = step.querySelector('.step-secondary');
      const next = step.querySelector('.next-peek');
      return {
        kind: step.dataset.flowStep,
        inner: rect(inner),
        content: content ? rect(content) : null,
        stage: stage ? rect(stage) : null,
        visual: visual ? rect(visual) : null,
        task: task ? rect(task) : null,
        card: card ? rect(card) : null,
        upload: upload ? rect(upload) : null,
        secondary: secondary ? rect(secondary) : null,
        next: next ? rect(next) : null,
        verticalOverflow: step.scrollHeight - step.clientHeight,
      };
    };
    const data = steps.map(readStep);
    activate(steps[0]);
    const master = rect(document.querySelector('.flow-head'));
    return {
      master,
      rail: rect(document.querySelector('.flow-rail')),
      introLogo: rect(document.querySelector('.intro-logo')),
      introCopy: rect(document.querySelector('.intro-copy-block')),
      introCTA: rect(document.querySelector('#startFlow')),
      steps: data,
      overflow: document.documentElement.scrollWidth - innerWidth,
      activeSteps: document.querySelectorAll('.flow-step.active').length,
    };
  });

  const close = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;
  if (report.activeSteps !== 1) fails.push(`${viewport.width}px: ${report.activeSteps} etapas activas`);
  if (report.overflow > 0) fails.push(`${viewport.width}px: overflow horizontal ${report.overflow}px`);
  if (viewport.width >= 800) {
    if (!close(report.master.left, report.rail.left) || !close(report.master.right, report.rail.right)) {
      fails.push(`${viewport.width}px: header y progreso no comparten bordes`);
    }
    const column = (report.master.width - 11 * 24) / 12;
    const expectedContentLeft = report.master.left + 2 * (column + 24);
    const expectedContentRight = report.master.right - 2 * (column + 24);
    if (!close(report.introLogo.left, report.master.left) || !close(report.introCopy.left, report.master.left) || !close(report.introCTA.left, report.master.left)) {
      fails.push(`${viewport.width}px: logo, copy y CTA de portada no parten del grid maestro`);
    }
    for (const step of report.steps.filter(step => step.kind.startsWith('item-'))) {
      if (!close(step.inner.left, report.master.left) || !close(step.inner.right, report.master.right) ||
          !close(step.stage.left, report.master.left) || !close(step.stage.right, report.master.right)) {
        fails.push(`${viewport.width}px ${step.kind}: columnas de producto fuera del grid maestro`);
      }
      if (!close(step.visual.left, step.stage.left) || !close(step.visual.right, step.stage.right) ||
          !close(step.task.left, step.stage.left) || !close(step.task.right, step.stage.right) ||
          !close(step.card.top, step.stage.top) || !close(step.upload.top, step.stage.top)) {
        fails.push(`${viewport.width}px ${step.kind}: producto y carga no forman una sola pieza`);
      }
      const nextGap = step.next.top - step.secondary.bottom;
      if (nextGap < 8 || nextGap > 42) fails.push(`${viewport.width}px ${step.kind}: el próximo paso quedó desacoplado (${Math.round(nextGap)}px)`);
    }
    for (const step of report.steps.filter(step => step.content && !step.kind.startsWith('item-'))) {
      if (!close(step.inner.left, report.master.left) || !close(step.inner.right, report.master.right) ||
          !close(step.content.left, expectedContentLeft) || !close(step.content.right, expectedContentRight)) {
        fails.push(`${viewport.width}px ${step.kind}: contenido no ocupa columnas 3 a 10`);
      }
    }
  } else {
    const contentWidth = Math.min(viewport.width - 40, 520);
    const contentLeft = (viewport.width - contentWidth) / 2;
    const introWidth = Math.min(viewport.width - 40, 540);
    const introLeft = (viewport.width - introWidth) / 2;
    if (!close(report.rail.left, 20) || !close(report.rail.right, viewport.width - 20)) {
      fails.push(`${viewport.width}px: progreso fuera de márgenes móviles`);
    }
    if (!close(report.introCopy.left, introLeft) || !close(report.introCTA.left, introLeft) || !close(report.introCTA.right, viewport.width - introLeft)) {
      fails.push(`${viewport.width}px: portada fuera de márgenes móviles`);
    }
    for (const step of report.steps.filter(step => step.kind !== 'intro')) {
      if (!close(step.inner.left, contentLeft) || !close(step.inner.right, viewport.width - contentLeft)) {
        fails.push(`${viewport.width}px ${step.kind}: margen móvil inconsistente`);
      }
    }
  }

  for (const step of report.steps) {
    if (step.verticalOverflow > 4) fails.push(`${viewport.width}px ${step.kind}: exige scroll de ${Math.round(step.verticalOverflow)}px`);
  }
  console.log(`${viewport.width}px: grid ${Math.round(report.master.left)}-${Math.round(report.master.right)}, ${report.steps.length} etapas alineadas, overflow 0`);
  await ctx.close();
}

await browser.close();
if (fails.length) { console.error('FALLAS:\n' + fails.join('\n')); process.exit(1); }
console.log('OK: portada y 8 etapas comparten grid; producto y carga forman una sola pieza, sin overflow');
