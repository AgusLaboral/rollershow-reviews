// Compuerta práctica de teclado y semántica para el recorrido principal.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8899/index.html';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport:{ width:390, height:844 } });
const page = await context.newPage();
const failures = [];
await page.goto(URL, { waitUntil:'networkidle' });

const semantics = await page.evaluate(() => {
  const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const missingAlt = [...document.querySelectorAll('img:not([alt])')].length;
  const unsafeBlank = [...document.querySelectorAll('a[target="_blank"]')]
    .filter(link => !link.relList.contains('noopener')).map(link => link.id || link.href);
  const unnamedDialogs = [...document.querySelectorAll('dialog')]
    .filter(dialog => !dialog.getAttribute('aria-label') && !dialog.getAttribute('aria-labelledby')).map(dialog => dialog.id);
  return { duplicates, missingAlt, unsafeBlank, unnamedDialogs };
});
if (semantics.duplicates.length || semantics.missingAlt || semantics.unsafeBlank.length || semantics.unnamedDialogs.length) {
  failures.push(`semántica incompleta ${JSON.stringify(semantics)}`);
}

await page.keyboard.press('Tab');
if (await page.evaluate(() => document.activeElement?.id) !== 'startFlow') failures.push('portada: el primer Tab no llega al CTA principal');
await page.keyboard.press('Enter');
await page.waitForTimeout(1100);
const firstStep = await page.evaluate(() => ({
  step:document.querySelector('.flow-step.active')?.dataset.flowStep,
  focus:document.activeElement?.dataset.flowStep,
  focusId:document.activeElement?.id,
  focusTag:document.activeElement?.tagName,
  backDisabled:document.querySelector('#flowBack').disabled,
  backHidden:document.querySelector('#flowBack').getAttribute('aria-hidden'),
}));
if (firstStep.step !== 'item-1' || firstStep.focus !== 'item-1' || firstStep.backDisabled || firstStep.backHidden !== 'false') {
  failures.push(`transición: foco o botón volver incorrectos ${JSON.stringify(firstStep)}`);
}

await page.evaluate(() => document.querySelector('#basesModal').showModal());
const dialogState = await page.evaluate(() => ({
  open:document.querySelector('#basesModal').open,
  focusInside:document.querySelector('#basesModal').contains(document.activeElement),
  name:document.querySelector('#' + document.querySelector('#basesModal').getAttribute('aria-labelledby'))?.textContent,
}));
if (!dialogState.open || !dialogState.focusInside || dialogState.name !== 'Bases del sorteo') failures.push(`modal: foco o nombre incorrecto ${JSON.stringify(dialogState)}`);
await page.keyboard.press('Escape');

const finalFocus = await page.evaluate(() => {
  document.body.classList.add('done');
  const google = document.querySelector('#gReviewBtn');
  google.hidden = false; google.focus();
  const style = getComputedStyle(google);
  return { focused:document.activeElement === google, outline:style.outlineStyle, width:parseFloat(style.outlineWidth) };
});
if (!finalFocus.focused || finalFocus.outline === 'none' || finalFocus.width < 3) failures.push(`cierre: Google no tiene foco visible ${JSON.stringify(finalFocus)}`);

await context.close();
await browser.close();
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK: teclado, foco, diálogos, nombres accesibles y enlaces externos verificados');
