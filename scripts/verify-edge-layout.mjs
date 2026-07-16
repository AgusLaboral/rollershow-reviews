// Cubre pantallas bajas y mobile horizontal: el ancho puede estar bien y aun así cortar el CTA.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const failures = [];
const viewports = [
  { width: 568, height: 320, label: 'mobile horizontal chico' },
  { width: 844, height: 390, label: 'mobile horizontal' },
  { width: 1024, height: 600, label: 'notebook baja' },
  { width: 1280, height: 640, label: 'desktop baja' },
];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  const reports = await page.evaluate(() => {
    const steps = [...document.querySelectorAll('.flow-step')];
    return steps.map(step => {
      steps.forEach(candidate => {
        candidate.classList.toggle('active', candidate === step);
        candidate.classList.remove('entering', 'leaving');
        candidate.style.transition = 'none';
      });
      step.scrollTop = step.scrollHeight;
      window.scrollTo(0, document.documentElement.scrollHeight);
      const primary = step.querySelector('.step-primary');
      const title = step.querySelector('.step-title');
      const bounds = element => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left };
      };
      return {
        name: step.dataset.flowStep,
        clientHeight: step.clientHeight,
        scrollHeight: step.scrollHeight,
        documentHeight: document.documentElement.scrollHeight,
        primary: primary && getComputedStyle(primary).display !== 'none' ? bounds(primary) : null,
        title: bounds(title),
        overflowX: step.scrollWidth - step.clientWidth,
      };
    });
  });

  for (const report of reports) {
    if (report.overflowX > 1) failures.push(`${viewport.label} ${report.name}: overflow horizontal ${report.overflowX}px`);
    const accessibleBottom = Math.max(viewport.height, report.documentHeight);
    if (report.primary && (report.primary.bottom > accessibleBottom + 1 || report.primary.top < 116)) {
      failures.push(`${viewport.label} ${report.name}: CTA no queda accesible al final ${JSON.stringify(report.primary)}`);
    }
  }
  console.log(`${viewport.width}x${viewport.height}: ${reports.length} etapas, CTA y overflow verificados`);
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK: pantallas bajas y mobile horizontal no cortan CTAs');
