# CLAUDE.md — Rollershow Reviews & Sorteo

Instrucciones persistentes para el agente (Claude Code, Codex, o cualquier otro). Leer entero antes de tocar código.

## ⚠️ Proyecto aislado — no mezclar

Esta carpeta es un **repo propio e independiente**, sin relación con:
- `Desktop\rollershow\` (la landing/legacy de Rollershow, otro repo, otra cuenta de GitHub Pages).
- `Desktop\rollershow-src\` (`frontend-lab`, el repo real de Nico en GitLab, Astro+Alpine).

**Nunca**: copiar código de esos repos para "reusar rápido" sin revisar, pushear a sus remotos, ni asumir que comparten stack (esos son Astro/Tailwind/Alpine; este es vanilla puro). Si hace falta reusar un asset (imagen, ícono), copiarlo a este repo — no referenciarlo por ruta relativa a otra carpeta.

## Qué es este proyecto

Web app (mockup) para que clientes que **ya compraron** cortinas Rollershow suban fotos/video de las instaladas, califiquen con estrellas, dejen un audio (estilo nota de voz de WhatsApp) y una opinión escrita — todo suma puntos que se traducen en chances de un sorteo mensual de 3 premios de decoración, anunciado en Instagram. Objetivo real de negocio: generar contenido (UGC) real para marketing, capitalizando clientes que ya confiaron, no leads sin convertir.

Plan completo, decisiones tomadas y razones detrás de cada una: **`PLAN.md`** (leer antes de proponer cambios de fondo — varias decisiones de diseño/copy ya fueron discutidas y cerradas con Agus, no re-litigar sin que él lo pida).

## Stack — deliberadamente simple

- **Un solo archivo**: `index.html` (HTML + CSS + JS inline, sin build, sin framework, sin dependencias de runtime). Así se construyó la landing legacy también — es el patrón que se usa para iterar rápido en mockups de Rollershow.
- **Sin backend real todavía.** Todo el estado vive en memoria del navegador (`state` en el JS) + `localStorage` para persistir estrellas/texto entre visitas.
- **`package.json`** existe SOLO para las herramientas de verificación (Playwright), no para el sitio en sí. El sitio no tiene build step.

## Estructura

```
index.html          — todo el sitio (mockup completo, single-file)
img/                — fotos: cortinas, hero, ganadores, vendedor placeholder
scripts/            — verificación con Playwright (ver abajo)
_scratch/            — capturas/output de verificación, gitignored, efímero
PLAN.md             — plan del proyecto + decisiones + historial de rondas de feedback
README.md           — resumen corto para quien clona el repo
```

## Cómo correr / verificar

```bash
npm install                      # una vez (playwright)
npx playwright install chromium  # una vez, si no está cacheado ya en la máquina

# servir el sitio y correr las verificaciones (en paralelo, dos terminales,
# o encadenado como abajo con PowerShell en Windows):
python -m http.server 8899 &     # o: npm run serve
node scripts/verify-reviews.mjs      # funcional: puntos, consentimiento, gracias, exit popup, bases, Google review
node scripts/verify-alignment.mjs    # alineación real (getBoundingClientRect) en 1280/1440/1920px — NO comparar screenshots a ojo
node scripts/verify-desktop.mjs      # capturas desktop (1280/1440) en _scratch/
node scripts/verify-tablet.mjs       # captura tablet (768) en _scratch/
```

Los scripts aceptan una URL como argumento (`node scripts/verify-reviews.mjs https://aguslaboral.github.io/rollershow-reviews/index.html`) para correr contra el sitio deployado en vez de local.

**Regla dura**: nada se reporta como "arreglado" sin correr esto contra el sitio en vivo después de deployar (ver Deploy). Un fix que solo se probó en local no cuenta.

## Deploy

Repo público `AgusLaboral/rollershow-reviews` en GitHub, Pages sirviendo desde `main` root (sin build, `.nojekyll` presente).

```bash
git add -A && git commit -m "..." && git push origin main
```

Push a `main` dispara el deploy de Pages automáticamente (~1 min). URL viva: **https://aguslaboral.github.io/rollershow-reviews/**

Después de cada push: esperar la propagación (`curl` el HTML hasta ver el cambio reflejado) y correr `verify-alignment.mjs`/`verify-reviews.mjs` contra la URL de Pages, no solo local.

## Decisiones ya cerradas (no re-litigar)

- **Puntos**: estrellas +5, texto +5, foto +10 c/u, video +25, audio +30. Cada 10 puntos = 1 chance; toda participación confirmada tiene mínimo 1 chance.
- **Participación sin foto**: permitida (solo calificar ya cuenta).
- **Colores**: Rojo Teja `#C63A21` (glow `#D2451E`, deep `#97290F`) es el color institucional del CTA principal — confirmado por Agus, reemplaza al terracota viejo (`#B8662C`, que queda como acento secundario). Verde WhatsApp real (`#25D366`/`#1FAD53`) para todo el módulo de audio, no terracota.
- **Sistema de contenedor único**: hero, carrusel de ganadores, barra de puntos y el resto de las secciones comparten el MISMO ancho máximo (1080px) y padding en desktop (`@media min-width:900px`). Si agregás una sección nueva, que use `.wrap` o copie ese mismo ancho — nunca un ancho angosto "por legibilidad" en un contenedor aparte (eso ya causó un bug real de alineación, dos veces).
- **Cards solo para unidades repetidas** (las 4 cortinas, los 5 ganadores). Todo lo demás (vendedor, estrellas, audio, texto) vive en un solo panel `.experiencia` con divisores internos, no cards separadas — es a propósito, no un olvido.
- **Reseña de Google auto-reportada**: Google no notifica si alguien realmente publicó la reseña (no existe webhook de Business Profile para eso). El flujo "Confirmar" es honor-system con una animación de "confirmando" puramente cosmética — no valida nada server-side. Documentado en el código, no es un bug.

## Pendientes reales (buscar `TODO(Nico)` en `index.html`)

1. **Integración con la API real**: reemplazar el bloque `PRESUPUESTO` hardcodeado por `GET /api/v2/presupuesto/:token` (cliente, vendedor con foto real, ítems comprados) y el `enviar()` simulado por `POST /api/v2/reviews` (multipart: fotos/video/audio/estrellas/texto/consentimiento). **Los puntos deben recalcularse server-side siempre** — nunca confiar en el valor que manda el cliente.
2. **Foto real del vendedor**: hoy usa un placeholder (`img/perfil-01.jpg`, nombre "Marcelo"). Traerla del CRM por presupuesto.
3. **Upload progresivo + compresión de imágenes** client-side (canvas, máx ~1600px, JPEG q0.82) antes de subir — hoy el mockup solo previsualiza localmente.
4. **Segundo local (Villa Carlos Paz)**: el link de reseña de Google en la página de gracias usa el ftid del local de **CABA** (`0x95bcb6719099596b:0x4354517b56352268`), confirmado por Agus. Falta decidir si un solo link alcanza para los dos locales o si hay que elegir según el local de origen del presupuesto.
5. **Los 3 premios reales del mes**: el hero (`img/hero-premios.jpg`) y las 5 fotos de "ganadores" (`img/ganador-*.jpg`) son representativos/generados (gpt-image-2), no los productos ni ganadores reales — ver nota fuerte abajo.
6. **Moderación**: alguien (¿Cami?) tiene que revisar fotos/audios antes de usarlos en marketing real. Es un proceso humano, no algo que resolver en código.

### ⚠️ Los "ganadores" del carrusel son inventados

Los 5 nombres/fotos en "Elegimos 3 ganadores cada mes" son placeholder generado con IA para el mockup (marcado con comentario explícito en el HTML, buscar "GANADORES REALES"). **No es sostenible mostrarlos como reales una vez que esto sea el sitio de producción** — hay que alimentar esa sección del historial real de sorteos antes de lanzar. No borrar ese comentario de advertencia sin resolver el punto.

## Reglas de diseño (aprendidas con feedback real, no inventar de nuevo)

- **Nada de tells de IA**: sin middots `·` ni em-dashes en copy visible, sin estrellas ASCII (usar SVG propio), sin "eyebrow" (etiqueta chica arriba de un título — es EL patrón que más se nota como IA), sin badges/chips repetidos de más, sin degradados/orbes decorativos genéricos.
- **Animaciones siempre activas** (no gatear en `prefers-reduced-motion`) — son livianas y descriptivas, no decorativas.
- **El atributo `hidden` pierde contra cualquier `display` propio de una clase en CSS de autor.** Si un elemento usa `hidden` para mostrarse/ocultarse por JS, agregar explícitamente `.clase[hidden]{display:none}` en el CSS — si no, se ven todos los estados superpuestos (bug real que ya pasó acá).
- **Verificar alineación con medición real** (`getBoundingClientRect`, ver `scripts/verify-alignment.mjs`), nunca comparando screenshots a ojo — dos elementos pueden lucir "distintos" en una captura y estar perfectamente alineados una vez que se descuenta el padding de cada contenedor.

## Fase 2 (anotada, NO ejecutar sin que Agus lo pida)

Una segunda app, con su propia URL, para correr el sorteo en sí: lista de participantes con sus tickets/chances, selección de ganador random ponderada por chances, puesta en escena para Instagram. Se construye con Innovatron cuando Agus lo confirme — no es parte de esta carpeta.
