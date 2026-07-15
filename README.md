# Rollershow Reviews & Sorteo

Mockup fase 1: web app para que clientes que ya compraron suban fotos/video de sus cortinas instaladas, califiquen con estrellas, dejen un mensaje de voz (estilo nota de WhatsApp) y una opinión escrita. Todo suma puntos que se traducen en chances de un sorteo mensual de 3 premios de decoración, anunciado en el Instagram de Rollershow.

**Sitio vivo**: https://aguslaboral.github.io/rollershow-reviews/

> Repo propio e independiente — no comparte historia ni assets por referencia con `rollershow` (landing) ni `rollershow-src` (frontend-lab de Nico). Ver **`CLAUDE.md`** para instrucciones completas de agente (Claude Code / Codex): stack, deploy, decisiones cerradas y pendientes reales.

- **`index.html`** — single-file, vanilla HTML+CSS+JS, sin build ni dependencias. Mobile-first.
- **`img/`** — hero + fotos de "ganadores" generadas, assets de cortinas copiados (no referenciados) del repo de la landing.
- **`scripts/`** — verificación con Playwright (self-contained, ver abajo).
- **`_scratch/`** — efímeros (screenshots de verificación), ignorado.
- **`PLAN.md`** — plan del proyecto y decisiones.

## Integración pendiente (Nico)

Buscar `TODO(Nico)` en `index.html`:
1. `GET /api/v2/presupuesto/:token` → cliente, vendedor (nombre + foto) e ítems comprados. El token llega por query (`?t=...`) desde el WhatsApp post-instalación.
2. `POST /api/v2/reviews` (multipart) → estrellas, texto, audio, media por ítem, consentimiento. **Los puntos/chances se recalculan server-side.**
3. Upload progresivo de archivos apenas se eligen + compresión de imágenes client-side (máx 1600px, JPEG q0.82).

## Mecánica

Foto 10 pts, video 25, audio 30, estrellas 5, texto 5. Cada 10 pts = 1 chance; toda participación confirmada tiene al menos 1 chance. Sorteo el último jueves hábil del mes, en vivo por Instagram.

## Verificación

```bash
npm install && npx playwright install chromium   # una vez
python -m http.server 8899                       # servir la carpeta
node scripts/verify-reviews.mjs                  # funcional: puntos, consentimiento, gracias, exit popup, bases, Google review
node scripts/verify-alignment.mjs                # alineación real (getBoundingClientRect) en desktop — no comparar screenshots a ojo
```

Detalle completo en `CLAUDE.md`.
