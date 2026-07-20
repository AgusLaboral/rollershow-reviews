# Rollershow Reviews & Sorteo

Mockup fase 1: web app multistep para que clientes que ya compraron recorran sus cortinas una por una, suban fotos/video y cuenten su experiencia en una sola etapa progresiva —estrellas, audio y una opinión breve— antes de confirmar su participación. Todo suma tickets para ganar 3 almohadones y 2 alfombras premium, sorteados entre 3 ganadores en Instagram.

La portada tiene una sola acción primaria. Para comparar movimiento sin duplicar lógica hay dos variantes del mismo flujo:

- `?v=ambientes`: recorrido con profundidad, como avanzar y retroceder por la casa.
- `?v=scroll`: recorrido vertical, controlable con scroll o swipe entre ambientes.

**Sitio vivo**: https://aguslaboral.github.io/rollershow-reviews/

> Repo propio e independiente — no comparte historia ni assets por referencia con `rollershow` (landing) ni `rollershow-src` (frontend-lab de Nico). Ver **`CLAUDE.md`** para instrucciones completas de agente (Claude Code / Codex): stack, deploy, decisiones cerradas y pendientes reales.

- **`index.html`** — single-file, vanilla HTML+CSS+JS, sin build ni dependencias. Mobile-first.
- **`img/`** — hero, assets de cortinas copiados (no referenciados) del repo de la landing y placeholders generados que ya no se muestran como prueba social.
- **`scripts/`** — verificación con Playwright (self-contained, ver abajo).
- **`_scratch/`** — efímeros (screenshots de verificación), ignorado.
- **`PLAN.md`** — plan del proyecto y decisiones.

## Integración pendiente (Nico)

Buscar `TODO(Nico)` en `index.html`:
1. `GET /api/v2/presupuesto/:token` → cliente, vendedor (nombre + foto) e ítems comprados. El token llega por query (`?t=...`) desde el WhatsApp post-instalación.
2. `POST /api/v2/reviews` (multipart) → estrellas, texto, audio, media por ítem, consentimiento. **Los tickets se recalculan server-side.**
3. Upload progresivo de archivos apenas se eligen + compresión de imágenes client-side (máx 1600px, JPEG q0.82).

## Mecánica

Cada foto, video, calificación u opinión escrita suma 1 ticket; el audio suma 3. Cada ticket es una chance en el sorteo y toda participación confirmada tiene al menos 1. La fecha concreta del sorteo se publica en la app y la transmisión se hace en vivo por Instagram.

## Verificación

```bash
npm install && npx playwright install chromium   # una vez
python -m http.server 8899                       # servir la carpeta
node scripts/verify-reviews.mjs                  # funcional: tickets, consentimiento, gracias, exit popup, bases, Google review
node scripts/verify-alignment.mjs                # alineación real (getBoundingClientRect) en desktop — no comparar screenshots a ojo
```

Detalle completo en `CLAUDE.md`.
