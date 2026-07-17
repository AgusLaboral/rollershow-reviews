# CLAUDE.md — Rollershow Reviews & Sorteo

Instrucciones persistentes para el agente (Claude Code, Codex, o cualquier otro). Leer entero antes de tocar código.

## ⚠️ Proyecto aislado — no mezclar

Esta carpeta es un **repo propio e independiente**, sin relación con:
- `Desktop\rollershow\` (la landing/legacy de Rollershow, otro repo, otra cuenta de GitHub Pages).
- `Desktop\rollershow-src\` (`frontend-lab`, el repo real de Nico en GitLab, Astro+Alpine).

**Nunca**: copiar código de esos repos para "reusar rápido" sin revisar, pushear a sus remotos, ni asumir que comparten stack (esos son Astro/Tailwind/Alpine; este es vanilla puro). Si hace falta reusar un asset (imagen, ícono), copiarlo a este repo — no referenciarlo por ruta relativa a otra carpeta.

## Qué es este proyecto

Web app multistep (mockup) para que clientes que **ya compraron** cortinas Rollershow suban fotos/video de las instaladas, califiquen con estrellas, dejen un audio (estilo nota de voz de WhatsApp) y una opinión escrita. Todo suma puntos que se traducen en chances de un sorteo mensual, anunciado en Instagram. Objetivo real de negocio: generar contenido (UGC) real para marketing, capitalizando clientes que ya confiaron, no leads sin convertir.

Plan completo, decisiones tomadas y razones detrás de cada una: **`PLAN.md`** (leer antes de proponer cambios de fondo — varias decisiones de diseño/copy ya fueron discutidas y cerradas con Agus, no re-litigar sin que él lo pida).

## Stack — deliberadamente simple

- **Un solo archivo**: `index.html` (HTML + CSS + JS inline, sin build, sin framework, sin dependencias de runtime). Así se construyó la landing legacy también — es el patrón que se usa para iterar rápido en mockups de Rollershow.
- **Sin backend real todavía.** El estado liviano vive en memoria + `localStorage`; fotos, videos y audio se guardan en `IndexedDB`. El borrador completo vuelve al mismo paso en el mismo navegador/dispositivo.
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
node scripts/verify-edge-layout.mjs  # mobile horizontal y pantallas bajas; CTA alcanzable y cero overflow
node scripts/verify-accessibility.mjs # teclado, foco, diálogos, nombres y enlaces externos
node scripts/verify-performance.mjs   # presupuesto mobile y ausencia de assets de rutas descartadas
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
- **Arquitectura multistep cerrada**: portada, una cortina por pantalla, experiencia progresiva y confirmación. En experiencia, la foto del vendedor ancla una conversación única: estrellas → audio → opinión breve, revelados de a uno sin cambiar de pantalla. No volver al formulario largo: Nicolás lo rechazó por carga cognitiva y riesgo de abandono.
- **Una acción primaria por pantalla**: la portada sólo tiene `Participar ahora`; links, volver, saltear y la próxima etapa insinuada nunca pueden competir visualmente.
- **Consentimiento de una sola acción**: la autorización completa es el único CTA del cierre. Al marcarla, la participación se registra y el flujo avanza automáticamente a Gracias; no agregar un botón redundante de confirmación. El propio texto del control avisa que autorizar también confirma la participación.
- **Celebración final intensa y honesta**: el último paso puede saturarse de recursos porque ya no enseña ni pide explorar; celebra el hito. La fiesta sale de los premios, la cortina sunscreen, los puntos y las chances reales. No inventar promedios, rankings ni cercanía determinista al premio; cada chance se explica como una oportunidad en el sorteo.
- **Gracias es una culminación, no una confirmación centrada**: después de participar, chances y puntos dejan de ser cards y se vuelven tipografía monumental. El roller libera fibras con gravedad, profundidad e inercia; las partículas pasan por detrás de las zonas legibles. La secuencia termina transfiriendo el foco a Google. No volver al check circular, dos contadores en cajas y confetti DOM uniforme.
- **Audio en dos decisiones, nunca envío implícito**: mientras se graba, `Terminar y guardar` es el único CTA visible y pulsante. Guarda la captura local y suma los puntos, pero no envía ni avanza; después aparecen escuchar, volver a grabar, borrar y `Continuar`. Al guardar u omitir, ese CTA normal entra antes del texto opcional, se centra en el viewport, recibe foco real y un énfasis transitorio; en desktop es compacto, no una barra de ancho completo. La frase de +5 queda como complemento visualmente secundario debajo. `Seguir sin audio` no puede competir durante la grabación.
- **Un solo recorrido oficial**: se eliminó la variante vertical porque la cortina dominaba la lectura y la diferencia no era comprensible. El recorrido canónico usa escala, desplazamiento y opacidad debajo del gesto principal; no volver a capas Z persistentes porque generaron composición inestable.
- **Cortina roller sunscreen, sin mecanismo visible**: el cambio de paso conserva el paño sunscreen como gesto de producto, pero no muestra tubo, soportes, cadena ni render. El paño existe sólo durante los 1,2 s del cambio, nace en el borde superior de toda la app por encima del logo, cubre y revela; en reposo `.roller-wipe` queda oculto. Evitar pliegues, terciopelo, mecanismos inventados o teatralidad cursi. No usar `backdrop-filter` ni blur sobre los planos animados: en algunas GPU generan cuadros negros durante la composición.
- **Animación siempre presente, con alternativa accesible**: no apagar la continuidad; en `prefers-reduced-motion` reducir distancia, blur y velocidad sin eliminar el feedback causal.
- **Paños finales sunscreen con materialidad visible**: los cinco paños de `.gr-curtain-reveal` conservan el ambiente, pero no pueden parecer una gasa invisible. Usan alfa cercano a `.70`, malla bidireccional, fibra irregular y variación de luz. El desenfoque se simula en la propia textura: no usar `backdrop-filter` en los paños animados porque la medición conjunta con video y canvas mostró cuadros descartados en mobile.
- **Video de fondo terminado, no salida cruda ni duración fingida**: los clips Kling son tomas continuas de 15 s con desplazamiento físico de cámara —arco, paneo y tilt con paralaje—, no zoom digital ni ping-pong. Se entregan H.264 `faststart` en la resolución nativa útil —1280×720 en desktop a 24 fps y 720×1280 en mobile a 30 fps interpolados por movimiento—; no hacer upscale que agregue decodificación sin sumar detalle. Usan `muted` y `playsinline`; las etapas de recorrido terminan quietas y el video de Gracias es la única excepción que usa `loop` como fondo persistente. La escena siguiente se precarga con un paso de anticipación. En Gracias no aplicar filtros ni blend modes por cuadro ni superponer un canvas full-screen: cortinas, video y confeti se secuencian, y las cintas usan animaciones `transform`/`opacity` compuestas por GPU. La aceptación mide el video junto con toda la celebración activa, no aislado, además de leer producto, textura, horizonte y recorrido en contactos temporales.
- **Una sola superficie por ambiente**: la foto de referencia, el producto y la carga forman una misma pieza `.item-stage`. No volver a separar tarjeta de catálogo y uploader: el CTA real es mostrar cómo quedó la cortina.
- **Datos variables sin copy frágil**: los CTAs entre cortinas nunca nombran el próximo ambiente: usan `Continuar` y, al terminar los ítems, `Dar mi opinión`. `ambiente_display` llega como nombre legible; si falta, el cliente ve `Tu cortina` cuando hay una sola o `Cortina N` cuando hay varias. No intentar interpretar ni corregir códigos internos del CRM en frontend.
- **Sorteo configurable desde un punto**: fecha, cantidad de ganadores, premios e imagen viven en `SORTEO`. Portada, confirmación, Gracias, salida y bases informativas derivan de ahí. Al cambiar premios, operaciones/legal debe revisar las Bases antes de publicar.
- **Vendedor real o ausencia limpia**: con nombre y foto se muestra la ancla personal; si la foto falla se conserva el nombre sin imagen, y si no hay nombre se oculta el bloque. Nunca inventar una persona, una foto ni una atribución de acompañamiento.
- **Reseña de Google auto-reportada**: Google no notifica si alguien realmente publicó la reseña (no existe webhook de Business Profile para eso). El flujo "Confirmar" es honor-system con una animación de "confirmando" puramente cosmética — no valida nada server-side. Documentado en el código, no es un bug.
- **Instagram es requisito, no cierre decorativo**: seguir a `@cortinas.rollershow` es condición de elegibilidad y se verifica manualmente antes de entregar el premio. Antes de Google se comunica como enlace secundario; después de confirmar la reseña, Google queda resuelto e Instagram pasa a ser el único CTA grande, con fecha y cuenta explícitas. La app no puede verificar follows sin autenticación: no fingirlo.

## Pendientes reales (buscar `TODO(Nico)` en `index.html`)

1. **Integración con la API real**: reemplazar el bloque `PRESUPUESTO` hardcodeado por `GET /api/v2/presupuesto/:token` (cliente, vendedor con foto real, ítems comprados) y el `enviar()` simulado por `POST /api/v2/reviews` (multipart: fotos/video/audio/estrellas/texto/consentimiento). **Los puntos deben recalcularse server-side siempre** — nunca confiar en el valor que manda el cliente.
2. **Foto real del vendedor**: hoy usa un placeholder (`img/perfil-01.jpg`, nombre "Marcelo"). Traerla del CRM por presupuesto.
3. **Upload progresivo**: la compresión client-side ya limita fotos a 1600 px y JPEG q0.82 sólo cuando reduce peso. Falta subir el archivo preparado apenas se elige, porque el mockup todavía previsualiza localmente.
4. **Segundo local (Villa Carlos Paz)**: la página de gracias usa el enlace directo al compositor de reseñas de CABA, confirmado por Agus (`!9m1!1b1`). Falta conseguir el equivalente del local de Villa Carlos Paz y decidir si el presupuesto debe elegir el destino.
5. **Imagen y asignación final de premios**: la comunicación aprobada dice `3 almohadones y 2 alfombras premium entre 3 ganadores`. El hero v2 (`img/hero-premios-v2.webp`) muestra exactamente esas cinco categorías y cantidades en alta resolución, pero sigue siendo representativo/generado. Falta definir qué recibe cada ganador y reemplazarlo por fotos de los productos reales si se lanza.
6. **Moderación**: alguien (¿Cami?) tiene que revisar fotos/audios antes de usarlos en marketing real. Es un proceso humano, no algo que resolver en código.
7. **Verificación del follow ganador**: antes de entregar el premio, Rollershow debe comprobar manualmente que la persona ganadora sigue a `@cortinas.rollershow`. Definir cómo vincular identidad/WhatsApp con la cuenta de Instagram sin agregar fricción al formulario.

## Compuerta legal antes de enviar a clientes

El mockup no está listo para operar un sorteo real. La mecánica actual nace desde la base de compradores, pero el Decreto 961/2017 exige, entre otras cosas, una vía de participación sin obligación de compra y que la comunicación informe fechas, alcance, requisitos y acceso a la información completa. También faltan la asignación exacta de los cinco objetos entre los tres ganadores, probabilidad o estimación, gastos para el ganador y mecanismo detallado de adjudicación. Fuente oficial: https://www.argentina.gob.ar/normativa/nacional/decreto-961-2017-291621/texto

No agregar “Sin obligación de compra” como copy vacío: primero Nicolás/operaciones deben definir una vía gratuita real y un profesional debe validar las bases. El consentimiento de marketing tampoco reemplaza el aviso de privacidad para fotos, video, voz y datos personales.

### Regla de evidencia para prueba social

No mostrar testimonios, nombres, fotos, premios ni ganadores de ejemplo como si fueran reales. La app usa una explicación verificable de la mecánica hasta que exista un historial real con autorización de uso.

## Reglas de diseño (aprendidas con feedback real, no inventar de nuevo)

- **Invariantes del multistep**: el CTA de portada debe quedar visible sin scroll en 320×700; cada etapa muestra una sola decisión primaria; los controles táctiles visibles tienen un área mínima de 44×44 px; y la primera decisión de cada cortina entra completa sin scroll en 320/390/768/1280. La cortina dura 1,2 s y libera la interacción a los 1,04 s: Agus priorizó que el gesto se entienda, con arranque lento y aceleración, sobre el límite anterior de medio segundo.
- **Composición responsive del paso de cortina**: en mobile la lectura es secuencial (ambiente, producto, carga, avance). Desde 800 px se recompone en dos zonas: cortina a la izquierda y decisión a la derecha. Es el mismo contenido y producto, no una versión desktop distinta.
- **Composición desktop de producto**: el encabezado del ambiente ocupa su propia fila. Debajo hay una única superficie de producto a sangre, con velo sunscreen y CTA de carga integrado. En desktop el prompt ocupa aproximadamente las cinco columnas derechas, centrado verticalmente en su sector; `Seguir sin foto ni video` queda inmediatamente debajo dentro de la misma decisión. En mobile ambos se apoyan abajo. No arrinconar el CTA ni recrear dos cajas enfrentadas.
- **Semántica visual del mockup**: cada nombre de ambiente tiene que coincidir con la foto. Living usa la imagen de living, Dormitorio la de camas, Escritorio la de escritorio y Home office la de oficina. No tratar las fotos como placeholders intercambiables.
- **Grid maestro desktop**: desde 800 px, header, barra de progreso, puntaje y contenido comparten un contenedor de 1120 px (con 40 px mínimos de margen). Los pasos simples ocupan una columna central de 680 px; la superficie de cada ambiente ocupa las 12 columnas y mantiene el CTA integrado, no como panel aparte. Verificarlo con `scripts/verify-motion.mjs`, no a ojo.
- **Placeholders de producto**: nunca estirar thumbnails. Las cuatro referencias actuales usan originales de 1024×1024 optimizados a 111–141 KB; `verify-reviews.mjs` falla si reaparece un archivo `thumb` o un ancho natural menor a 1000 px.
- **Copy del recorrido**: beneficio y acción concreta al frente, voseo rioplatense y una sola idea por bloque. Sin frases de campaña abstractas, culpa por calificaciones bajas, middots, em-dashes ni repetición mecánica. El puntaje se integra en la explicación, no en badges separados.
- **Confirmación específica, no plantilla de logro**: el título nombra lo que la persona hizo (`Mostraste un ambiente` / `Mostraste 4 ambientes`) y la bajada indica la próxima decisión. No volver a “Mirá todo lo que sumaste”, “Tus aportes ya están listos” ni fórmulas equivalentes. Puntaje y autorización forman una misma fila semántica en desktop; la capa de puntaje es transparente sobre la escena final.
- **Movimiento visible, no transición cosmética**: el recorrido oficial conserva simultáneamente pantalla saliente y entrante en planos Z opuestos. El plano saliente no puede ocultarse antes de desarrollar el movimiento. `verify-motion.mjs` controla transforms distintos, material, timing y cierre limpio.
- **Micro-recompensas causales, no gamificación genérica**: cada ganancia real responde en el lugar de la acción y confirma qué quedó guardado. Foto/video usa luz sobre la cortina; estrellas se ordenan; audio asienta su onda; texto cierra una línea. Después, una única pieza de tela con `+N` recorre una trayectoria fija desde esa acción hasta el puntaje estable y el contador recibe el impacto. No puede nacer en coordenadas aleatorias ni quedar flotando. Puntos y chances muestran ganancia exacta y total nuevo; el copy rota y `aria-live` comunica el resultado. No agregar confetti, emojis, badges, count-ups o sonidos; la cortina sigue siendo el gesto principal.
- **Progreso sin ventanas extra**: usar la línea de avance, el contador discreto y el puntaje sin tarjeta flotante. No volver a chips o paneles superpuestos para esos tres datos.
- **Sin mecanismo visible ni decorativo**: junto a chances/puntos no vive ningún tubo, soporte, cadena, render ni imitación 3D. El paño de transición nace fuera del viewport, por encima del logo, y vuelve a quedar completamente oculto al asentarse cada etapa. No intentar resolverlo con un asset “más realista” hasta que exista una pieza de producto real aprobada por Agus.
- **Acciones secundarias dentro de su decisión**: `Seguir sin foto ni video` pertenece a la misma superficie que el CTA de carga, inmediatamente debajo y con sus mismos bordes. No puede quedar flotando fuera del módulo ni crear una segunda zona de acción desconectada.
- **Acciones posteriores unidas y centradas**: cuando una foto o video reemplaza el placeholder, la superficie y su bandeja forman una sola pieza. Primaria y secundaria comparten un eje central y un ancho máximo de 640 px; avanzar va arriba y agregar contenido debajo. No volver a repartirlas en columnas, alinear una a cada lado ni dejar un link huérfano. La secundaria usa `Agregar otra foto o video` y explicita en otra línea `Foto +10 puntos. Video +25 puntos.`
- **La recompensa acompaña la decisión**: toda acción que crea una recompensa anticipa el valor exacto en el propio CTA o pegado al control: foto `+10 puntos`, video `+25`, audio `+30`, calificación `+5`, texto `+5` y Google `duplicá tus puntos`. Esto aplica aunque el beneficio ya se haya explicado arriba. No prometer puntos en botones que sólo avanzan, reemplazan o revisan contenido.
- **Cierre desktop ordenado por estado**: chances es el logro principal y puntos el dato secundario, pero ambos usan la misma profundidad y una base óptica común. No cruzar el bloque inferior con divisores u órbitas. El éxito de Google usa un check SVG de 48 px, texto de alto contraste y `role=status`; no un tilde suelto de 17 px.
- **Portada mobile dentro del viewport real**: usar `100dvh` como altura efectiva, con `100vh` sólo como fallback declarado antes; nunca `max(100vh,100dvh)`. La portada no hereda el padding superior general de los pasos bajos. Logo, copy y CTA se distribuyen por altura, sin scroll interno, y el CTA conserva al menos 12 px de aire respecto del borde visible.
- **Nada de tells de IA**: sin middots `·` ni em-dashes en copy visible, sin estrellas ASCII (usar SVG propio), sin "eyebrow" (etiqueta chica arriba de un título — es EL patrón que más se nota como IA), sin badges/chips repetidos de más, sin degradados/orbes decorativos genéricos.
- **Animaciones siempre activas** (no gatear en `prefers-reduced-motion`) — son livianas y descriptivas, no decorativas.
- **El atributo `hidden` pierde contra cualquier `display` propio de una clase en CSS de autor.** Si un elemento usa `hidden` para mostrarse/ocultarse por JS, agregar explícitamente `.clase[hidden]{display:none}` en el CSS — si no, se ven todos los estados superpuestos (bug real que ya pasó acá).
- **Verificar alineación con medición real** (`getBoundingClientRect`, ver `scripts/verify-alignment.mjs`), nunca comparando screenshots a ojo — dos elementos pueden lucir "distintos" en una captura y estar perfectamente alineados una vez que se descuenta el padding de cada contenedor.
- **El eje desktop responde a la tarea, no a una regla de centrado**: las etapas de lectura ocupan las columnas centrales; en ambientes, la carga queda a la derecha para conservar visible el producto; en confirmación, puntaje y autorización usan un bloque ópticamente centrado de diez columnas. No llevar todo a la derecha ni centrar CTAs sobre la cortina por uniformidad.
- **Un total no se lee dos veces**: en confirmación, el logro grande reemplaza al contador compacto del encabezado. El roller sigue visible a todo el ancho, pero los números de arriba se retiran para no competir con chances y puntos protagonistas.
- **Movimiento intenso no significa movimiento permanente**: el roller concentra la transición. Escala, stagger y profundidad sólo sostienen su lectura con recorridos cortos; al asentarse la pantalla, números, grano y fondos dejan de moverse. El cierre conserva partículas y física, pero con presupuesto acotado y zonas legibles estables.
- **Carga mobile sobria**: no construir rutas ocultas descartadas ni descargar sus fotografías. Hero y capas animadas deben respetar `srcset`; el shell inicial, sin contar el video progresivo, no supera 850 KB y sus imágenes no superan 400 KB. El primer video puede sumar hasta 1,9 MB porque arranca durante el parseo; debe ser H.264 `faststart`, no bloquear el DOM y sostener un poster exacto mientras llegan sus primeros datos. Las fotos del usuario se preparan a 1600 px, JPEG q0.82, conservando el original cuando recomprimirlo aumentaría el peso.
- **Inicio de video sin cambio de plano**: el primer MP4 se declara con `<source>` responsive y `preload="auto"` en el HTML; no se posterga con `load`, timers ni interacciones. El poster es el cuadro cero exacto de cada variante y permanece inmóvil, con el mismo `object-fit` y encuadre. El video sólo gana opacidad cuando puede reproducirse y el empalme dura 160 ms como máximo. La aceptación retrasa la red 1,2 s y exige que no cambien escala, posición ni plano durante la espera.
- **Teclado acompaña la escena**: el botón volver no entra al tab order en portada; después de cada cortina el foco llega a la etapa revelada, no al control de la pantalla anterior. Google, Instagram, modales y acciones secundarias siempre muestran foco visible.

## Fase 2 (anotada, NO ejecutar sin que Agus lo pida)

Una segunda app, con su propia URL, para correr el sorteo en sí: lista de participantes con sus tickets/chances, selección de ganador random ponderada por chances, puesta en escena para Instagram. Se construye con Innovatron cuando Agus lo confirme — no es parte de esta carpeta.

## Reemplazo de referencia y recompensa de puntos — 2026-07-15

- La referencia de cada ambiente parte desenfocada, pero conserva una fuente real de 1024×1024. El blur está pre-renderizado para no reintroducir los cuadros negros vistos con filtros CSS sobre planos animados. Al cargar una foto o video, el archivo del usuario la reemplaza dentro de la misma superficie; no se crea una miniatura ni una caja paralela.
- La carga correcta dispara una sola recompensa local: `+10` o `+25` domina el ambiente detrás de una banda roller sunscreen que baja y se retira. Luego ese mismo valor viaja al contador por una trayectoria causal, acción a total. No usar papel picado, rombos, toasts, barras de estado ni movimientos que nazcan de coordenadas arbitrarias; `aria-live` anuncia el logro.
- Después de cargar, la foto pasa a ser protagonista y desaparece el uploader superpuesto. Continuar es el único CTA; “Sumar otra foto o video” queda como link secundario debajo. El borrado es un único control cuadrado alineado arriba a la derecha, sin contador ni pill.
- Con varias cargas se muestra la última. Borrarla recupera la anterior; borrar la única recupera el placeholder, retira el estado completado y recalcula puntos/chances.
- La aceptación automatizada cubre reemplazo real, ausencia de previews/toasts/pills/eyebrows, suma acumulada, recuperación al borrar, ejes internos de título/superficie/acciones, reduced motion, grid y overflow de 320 a 1920 px.
