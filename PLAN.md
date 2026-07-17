# PLAN — Rollershow Reviews & Sorteo

> Proyecto nuevo. Web app (mockup primero) para que clientes que YA compraron dejen fotos/video de sus cortinas instaladas + review (estrellas, audio, texto), a cambio de chances en un sorteo mensual de 3 productos de decoración publicado en Instagram.
> Estado: **mockup deployado y verificado** en https://aguslaboral.github.io/rollershow-reviews/ (2026-07-14). Decisiones de Agus: puntos tabla §3, URL /tu-experiencia, participación sin foto sí, hero con la API GPT de Rollershow. Falta: premios reales del mes, foto real de vendedores, integración de Nico (buscar `TODO(Nico)` en index.html).

> Replanteo 2026-07-15: Nicolás rechazó el formulario largo por carga cognitiva. La nueva arquitectura es multistep: portada con un CTA y premios concretos, una cortina por etapa, experiencia progresiva y confirmación final. Premio comunicado: **3 almohadones + 2 alfombras premium entre 3 ganadores**. Agus marcó que animar una cortina literal puede verse cursi, por lo que se prepararon dos variantes comparables: `?v=ambientes` (profundidad adelante/atrás) y `?v=scroll` (desplazamiento vertical por scroll/swipe). Un MP4 puede usarse después para afinar ritmo, no es dependencia del prototipo.

---

## 1. Por qué vale la pena (el filtro)

- **¿Acerca plata o es interesante nomás?** Acerca plata por dos vías: (a) UGC real — fotos de cortinas Rollershow instaladas en hogares reales — es la prueba social que hoy NO existe y que alimenta landings, ads y al propio Ulises; (b) reviews con audio humanizado refuerzan el posicionamiento "calidad + asesoramiento humano". Además capitaliza la base de **compradores** (mejor todavía que los leads no convertidos: ya confiaron).
- **Versión más simple que valida:** un single-file vanilla (HTML+CSS+JS, sin build, como el cotizador) con 4 cortinas hardcodeadas y todo comentado para que Nico enchufe la API. Cero backend en fase mockup.
- **Decisiones creativas mayores** → van al bloque final (§8) como opciones con recomendada, no las decido solo.

## 2. Flujo del usuario (mobile-first, 90% va a abrir desde WhatsApp)

1. **Llegada**: el cliente recibe un link personalizado por WhatsApp (lo dispara Cami/Ulises post-instalación). El link trae un token → la app sabe qué compró. *En el mockup: token simulado, 4 cortinas de ejemplo.*
2. **Hero**: imagen de alta calidad con los 3 premios del mes + titular del sorteo + fecha del sorteo + "el ganador se anuncia en nuestro Instagram" (link para seguir).
3. **Tus cortinas** (el corazón): un card por ítem del presupuesto — "Living · Blackout · [tela]" — cada uno con zona de drag & drop / adjuntar / **sacar foto con la cámara** (input capture en mobile). Cada foto suma puntos EN VIVO en una barra de chances sticky.
4. **Tu experiencia**: estrellas → grabador de audio estilo WhatsApp (grabar, escuchar, regrabar, borrar; micrófono, waveform, burbuja verde-oliva familiar pero con paleta Rollershow) → texto opcional. Acá va la **foto del vendedor real**: "¿Cómo te atendió Marcelo?" — humaniza y dispara el audio personal.
5. **Confirmar participación** (única acción primaria de la página, máximo contraste) → **página de gracias**: puntos totales juntados, equivalencia en chances, fecha del sorteo, CTA a Instagram "Seguinos para ver al ganador".

Orden deliberado: **fotos primero** (el objetivo real del proyecto), review después. La calificación no es peaje de entrada.

## 3. Sistema de puntos — crítica y propuesta

Lo que planteaste: foto = 10 pts, audio = 3× foto (30), estrellas = igual que foto (10).

**Mi crítica:** calificar con estrellas es esfuerzo casi nulo (un tap). Si vale lo mismo que sacar una foto del living, devalúa la foto — y la foto es el objetivo máximo. Además el video no tenía puntaje y para marketing vale más que todo lo demás.

**Propuesta recomendada:**

| Acción | Puntos | Razón |
|---|---|---|
| Estrellas | 5 | Esfuerzo mínimo; igual queremos que todos lo hagan |
| Texto de opinión | 5 | Ídem |
| Foto por ambiente | 10 c/u | El core |
| Video del ambiente | 25 | El contenido más valioso para ads |
| Audio de experiencia | 30 (tu 3×) | De acuerdo: es lo más personal y difícil de conseguir |

Y en la UI hablar de **chances, no puntos abstractos**: "cada 10 puntos = 1 chance en el sorteo". Un número que se traduce en probabilidad de ganar es más motivante que un score suelto. La barra sticky muestra "Tenés 4 chances 🎟 → subí otra foto y sumás 1 más".

## 4. Lo que agrego yo (recomendaciones para aprobar)

1. **Consentimiento de uso de imagen** — crítico: si vamos a usar las fotos en ads/landings, sin un checkbox "autorizo a Rollershow a usar mis fotos y opinión" el UGC no sirve legalmente. Un checkbox simple pre-CTA, texto amable.
2. **Bases y condiciones del sorteo** — en Argentina una promoción con sorteo necesita B&C aunque sea mínimas (link chico en el footer). Las redacto yo, las revisás.
3. **Mini-guía de foto buena** — 3 tips visuales al lado del uploader ("con luz de día, que se vea la cortina entera, horizontal"). Sube la calidad del material, que es el fin real del proyecto.
4. **Compresión de fotos en el navegador** antes de subir (canvas) — el cliente está en mobile con datos; una foto de 8 MB que tarda mata la participación.
5. **Progreso guardado en el dispositivo** (`localStorage` + `IndexedDB`) — si cierra y vuelve en el mismo navegador, conserva paso, fotos/videos, estrellas, audio y texto.
6. **Exit popup calibrado por engagement** (no timer): si ya sumó puntos y va a irse sin confirmar → "Te vas con 40 puntos sin participar. Confirmá y entrás al sorteo". En mobile solo botón Atrás + inactividad (nada de blur/visibilitychange, ya sabemos que da falsos positivos).
7. **Video también por ítem** — mismo uploader acepta foto o video corto (max ~30s), con el puntaje diferencial de la tabla.
8. **Deadline real, no urgencia falsa** — fecha concreta del próximo sorteo visible ("Sorteo: 31 de julio, en vivo en Instagram"). Cero contadores fake.
9. **Barrido anti-tells** desde el diseño: estrellas SVG propias (no ★ ASCII), nada de pills verde-WhatsApp genéricos, audio con estética WhatsApp *en patrón de interacción* pero con paleta Rollershow, cero middots/em-dashes, todo contenido en su contenedor.
10. **Estética**: acá aplica la landing "linda" (quality), NO la vichy — este público ya compró, no está comparando precio; la percepción de calidad refuerza que compró bien y sube la vara de la foto que manda.

## 5. Lo que te falta definir (riesgos y huecos que veo)

- **Quién dispara el link y cuándo**: propongo ~1 semana post-instalación, vía Cami/Ulises. Si se manda antes de instalar, no hay foto posible.
- **Moderación**: alguien (¿Cami?) tiene que revisar fotos/audios antes de usarlos en marketing. Es proceso, no app — pero hay que nombrarlo dueño.
- **¿Puede participar sin foto?** Recomiendo sí (solo estrellas+texto = pocas chances) — capturamos la review igual y no frustramos al que no quiere mostrar su casa.
- **Los 3 premios del mes**: necesito qué productos son y **fotos reales de buena calidad** para el hero (te las pido a vos / Pollo — yo no genero imágenes).
- **Foto del vendedor**: en el mockup va 1 vendedor de ejemplo con foto placeholder; Nico la trae del CRM por presupuesto. ¿Existe foto de cada vendedor hoy? Si no, es un pedido interno a Marcelo.

## 6. Stack y ejecución

- **Fase mockup (esta)**: single-file `index.html` vanilla (HTML+CSS+JS, sin dependencias, sin build) en repo nuevo — mismo patrón que el cotizador legacy que ya funciona bien para iterar rápido. Mobile-first, verificado con Playwright a 360/390px.
- **Puntos de conexión comentados para Nico** (en el código, estilo `// TODO(Nico):`):
  - `GET /api/v2/presupuesto/:token` → ítems comprados (ambiente, producto, tela) + vendedor (nombre, foto).
  - `POST /api/v2/reviews` → multipart con fotos/videos/audio + estrellas + texto + consentimiento + puntos calculados server-side (nunca confiar en el cliente para las chances).
- **Repo**: `AgusLaboral/rollershow-reviews` (privado) + maqueta en GitHub Pages para que la veas viva en el teléfono. Gate nuclear de deploy aplica: nunca link sin CSS verificado.
- **Audio**: MediaRecorder API nativa (cero dependencias). Fallback con mensaje claro si el navegador no da permiso de micrófono.
- Carpeta local: `Desktop\rollershow-reviews\`, con la convención `_scratch/` para efímeros.

## 7. Fase 2 (anotada, NO se ejecuta ahora)

App del sorteo con Innovatron, URL aparte: lista de participantes con sus tickets, selección de ganador random **ponderada por chances**, con puesta en escena linda para grabar/transmitir en Instagram. Se planifica cuando la fase 1 esté aprobada y juntando data real.

## 8. Decisiones que necesito de vos (un solo bloque)

1. **Sistema de puntos**: (A) tu original — foto 10 / audio 30 / estrellas 10; **(B) mi tabla del §3 con video 25 y estrellas 5 + lenguaje de "chances" (recomendada)**.
2. **Nombre/URL de la app**: (A) algo funcional tipo `rollershow.com.ar/tu-experiencia`; (B) con marca de sorteo tipo `/sorteo` — **recomiendo (A)**: el sorteo es el incentivo, no la identidad; "tu experiencia" envejece mejor cuando el sorteo rote.
3. **Premios del mes**: cuáles son los 3 productos y pasame (o pedile a Pollo) fotos en alta para el hero. Mientras, avanzo con placeholder digno.
4. **¿Participación sin foto?** Recomiendo sí (§5). Decí si estás de acuerdo.

Con el OK (o correcciones) de este plan, arranco la ejecución del mockup.

## 9. Perfeccionamiento del multistep — 2026-07-15

- Se mantuvo la arquitectura cerrada por Nicolás: portada, una cortina por pantalla, experiencia por etapas y confirmación. No se agregó contenido ni navegación paralela.
- Se eliminó carga visual: puntaje sin tarjeta flotante, progreso lineal, una sola mención del valor en puntos, copy de salto explícito y una única acción primaria por estado.
- Mobile quedó secuencial y sin scroll para descubrir la decisión en 320×700 y 390×844. Desktop usa el ancho disponible con cortina a la izquierda y acción a la derecha, sin convertirlo en otro producto.
- Accesibilidad: objetivos táctiles de 44 px, uploader operable por teclado, foco visible, textarea con estilo consistente, progreso semántico y parada segura de la grabación al abandonar el paso.
- Movimiento: continuidad de `ambientes` y `scroll` preservada, con bloqueo real reducido a menos de medio segundo. La versión scroll conserva gesto y control visible alternativo.
- Performance: hero responsive en WebP (768/1536 px). Lighthouse local: accesibilidad 100, buenas prácticas 100, performance 82; el principal costo restante es la tipografía remota y no se vuelve asíncrona para evitar salto visual.
- Pruebas: flujo completo y geometría aprobados en `ambientes` y `scroll`, 320/360/390/768/1280 px, incluida la compuerta que falla si el CTA de portada queda debajo del pliegue o si la primera decisión exige scroll.

## 10. Corrección de grid y movimiento — 2026-07-15

- El pase anterior estaba funcional pero visualmente subcalibrado: ocultaba el plano saliente a los 70 ms, por lo que la profundidad no llegaba a leerse, y mezclaba un header de ancho completo con contenido de 980 px.
- Nuevo grid maestro de 1120 px: en 1024/1280/1440/1920, header, progreso y contenido comparten respectivamente los bordes 40–984, 80–1200, 160–1280 y 400–1520.
- `ambientes`: cámara con entrada desde Z -280 px y salida hacia Z positivo, escala, blur y capas internas con velocidades distintas.
- `scroll`: dos pantallas coexistentes recorren aproximadamente 94% del viewport en sentidos opuestos; el movimiento por wheel/swipe conserva el botón como alternativa visible.
- La interacción vuelve a habilitarse a los 620 ms y la secuencia visual termina a los 940 ms. Sigue siendo una transición breve, pero ahora el gesto de producto llega a leerse completo.
- Corrección final: una cortina roller texturada baja, cubre la escena y sube para revelar el ambiente siguiente. No usa pliegues ni teatralidad; funciona sobre las dos variantes y refuerza la marca sin sumar decisiones.
- En desktop se eliminó el centrado vertical accidental del grid de cada ambiente. Imagen, título y uploader parten del mismo borde superior útil; en portada, promesa, premio, fecha y CTA forman un solo bloque.
- Se agregó `scripts/verify-motion.mjs`: falla si la cortina roller no participa, si las escenas no coexisten, no usan transforms distintos, no terminan limpias o rompen el grid maestro.

## 11. Consolidación visual y grid completo — 2026-07-15

- Se eliminó la variante vertical: detrás de la cortina la diferencia no llegaba a leerse y mantenía dos comportamientos sin beneficio para la persona. Queda un único recorrido oficial con profundidad.
- El material de la cortina pasó a sunscreen translúcido: trama tejida bidireccional, ruido fractal SVG y microvariación tonal. Se eliminó `backdrop-filter` y el blur de los planos porque provocaban cuadros negros en capturas/GPU; la transparencia y textura se conservan con CSS/SVG nativo.
- Todas las etapas usan el mismo grid maestro. Producto ocupa columnas 1–7 y 8–12; experiencia y confirmación ocupan columnas 3–10. Logo, copy y CTA de portada comparten el borde izquierdo del grid.
- En mobile, las acciones de experiencia dejaron de quedar aisladas al fondo: aparecen inmediatamente después del bloque al que responden.
- `scripts/verify-alignment.mjs` recorre las 7 etapas completas en 320/390/768/1024/1280/1440/1920 px; ya no valida sólo portada y primera cortina.

## 12. Cierre de composición y handoff a Google — 2026-07-15

- El último ambiente ya no empuja “Después: tu experiencia” al fondo de una columna artificialmente alta; queda ligado al bloque de acción con un espacio controlado.
- La cortina dura 1,2 s: arranca casi detenida, acelera al cubrir y luego revela. Se verificó cuadro por cuadro y se retiraron filtros de composición inestables que generaban cuadros negros.
- La portada suma tres capas recortadas del producto con movimientos lentos independientes, sin agregar requests ni distraer del único CTA.
- Al confirmar, el foco y el scroll llegan al botón de Google con un pulso visible. El CTA usa la URL directa del showroom de Roseti 1674 con la acción `!9m1!1b1`, que abre el compositor de reseñas (o primero el login de Google si no hay sesión).
- Los tests ahora cubren el acople vertical del próximo paso, el timing de la cortina, las capas independientes de portada, el foco final y la estructura del enlace de Google.

## 13. Replanteo real de las pantallas de producto — 2026-07-15

- La corrección anterior seguía aprobando una pantalla visualmente rota: el uploader arrancaba junto al título mientras la tarjeta arrancaba mucho más abajo, y en mobile `margin-top:auto` separaba el salto de la acción.
- Nueva estructura: encabezado del ambiente en una fila propia; debajo, foto y uploader comparten borde superior. Las acciones secundarias quedan unidas al uploader, sin altura mínima ni espacios fabricados.
- Se corrigió el contenido absurdo del mockup: Living mostraba camas. Las cuatro fotos ahora corresponden a Living, Dormitorio, Escritorio y Home office.
- El recorrido abandonó capas Z persistentes y usa escala/desplazamiento 2D bajo la cortina. Mantiene el efecto, pero reduce fragilidad de composición.
- Se agregó aceptación específica a 1165×674, el tamaño de la captura que reveló la falla, además de 320–1920 px.

## 14. Recompensa por acción y transiciones internas — 2026-07-15

- Se incorporó una recompensa breve después de cada logro real: carga de foto/video, primera calificación, audio terminado y texto que alcanza el mínimo. Hay tres copys rotativos por tipo de acción para evitar repetición mecánica.
- El feedback pertenece al producto: barrido de luz sobre la cortina, estrellas que se asientan, onda de voz y cierre de texto. Los puntos viajan al contador; no se usa confetti repetido ni se compite con el CTA.
- Sólo puede verse una recompensa global a la vez, dura menos de dos segundos, no captura eventos ni mueve el layout. Un estado `aria-live` anuncia el logro y `prefers-reduced-motion` conserva la causalidad con menos recorrido.
- Las entradas de etapa ahora escalonan encabezado, visual y tarea. La cortina sigue siendo el gesto central; el escalonamiento sólo ordena la lectura al revelar la pantalla siguiente.
- Las pruebas funcionales verifican recompensa, puntaje y reacción local para foto, estrellas, audio y texto. La prueba de movimiento verifica además el escalonamiento junto con la cortina y el grid completo.

## 15. Superficie única de producto y auditoría de copy — 2026-07-15

- La tarjeta de producto y el uploader separados competían entre sí y generaban demasiadas cajas. Se reemplazaron por una sola superficie: foto a sangre, velo con trama sunscreen, producto integrado y el CTA de carga como único elemento rojo.
- El control se adapta sin cambiar de concepto: abajo en mobile y sobre el lado derecho de la imagen en desktop. Después de subir, cambia a “Sumar otra foto o video” y recién entonces aparece el CTA para avanzar.
- Las miniaturas de 480×480 que se estiraban en desktop se reemplazaron por fuentes de 1024×1024 del sistema Rollershow, optimizadas a 111–141 KB. Se eliminaron los cuatro thumbs viejos.
- Se auditó el copy del flujo completo: portada con acción concreta, consignas breves, estrellas sin culpa, audio y texto con beneficio explícito, confirmación directa y handoff de Google sin fingir validación técnica.
- Los tests ahora fallan si vuelve una miniatura, si producto y carga dejan de ser una sola pieza, si reaparecen separadores vetados o si los mensajes centrales vuelven a copy genérico.

## 16. Reemplazo de referencia y recompensa de puntos — 2026-07-15

- [x] Desenfocar los placeholders de alta resolución sin sustituirlos por thumbnails de baja.
- [x] Reemplazar el placeholder por la foto/video real dentro de la misma superficie.
- [x] Eliminar la miniatura duplicada del flujo multistep.
- [x] Priorizar `+10`/`+25` con una banda roller local y transferirlos al contador por una trayectoria causal, sin confetti, rombos ni toast.
- [x] Recalcular puntos y recuperar el archivo anterior o placeholder al borrar.
- [x] Verificar flujo, movimiento, reduced motion, grid y overflow de 320 a 1920 px.

## 17. Reset anti-IA y composición interna — 2026-07-15

- [x] Eliminar pills de archivo, mini-preview siguiente, metadata sobre fondo variable y eyebrow de ambiente.
- [x] Sacar todos los avisos flotantes y recompensas posicionadas por coordenadas de foto, estrellas, audio y texto.
- [x] Separar los estados: antes de cargar manda el uploader; después manda continuar y “sumar otra” es secundario.
- [x] Quitar cajas dobles en audio/texto y reemplazar las dos cards de confirmación por una frase.
- [x] Medir ejes internos de título, superficie y acciones en cada ambiente y breakpoint.

## 18. Audio y progreso con recompensa real — 2026-07-15

- [x] Convertir `Terminar y guardar` en CTA principal de ancho completo, con pulso propio y sin salida secundaria durante la captura.
- [x] Separar detener de avanzar: al terminar aparecen escuchar, volver a grabar, borrar y recién entonces continuar.
- [x] Dar jerarquía estable a chances antes que puntos y animar el cambio en el mismo contador, sin marcador persistente ni count-up genérico.
- [x] Expresar cada logro con consecuencias exactas: puntos ganados, chances nuevas y total resultante; variar el incentivo local sin prometer cercanía determinista a un premio sorteado.
- [x] Verificar estados de audio grabando/revisión y geometría mobile/desktop; hacer opaco el fondo de cada etapa para evitar transparencias de composición.

## 19. Celebración final y relevo de CTA — 2026-07-15

- [x] Convertir el cierre en una escena celebratoria con fotografía real de premios, capas móviles y bandas sunscreen, sin confetti ni badges genéricos.
- [x] Hacer de chances el logro principal, con puntos, ambientes mostrados y premios concretos como evidencia secundaria.
- [x] Simplificar el cierre a una sola acción: marcar la autorización también confirma la participación y avanza automáticamente a Gracias.
- [x] Avisar en el propio texto del control que autorizar confirma la participación, evitando un cambio de contexto sorpresivo para tecnologías de asistencia.
- [x] Sustituir la comparación inventada con un promedio por una consecuencia verificable: cada chance es una oportunidad en el sorteo.
- [x] Verificar el consentimiento y avance automático en mobile y desktop, sin scroll en 320×700 y sin romper el grid de 320 a 1920 px.

## 20. Trayectoria causal, contador reservado y audio real — 2026-07-15

- [x] Reservar una fila completa para chances y puntos debajo del progreso. Ninguna etapa puede comenzar antes de su borde inferior ni usar ese espacio.
- [x] Hacer que `+10`, `+25`, `+5` o `+30` nazca en la acción y viaje hasta el total con una pieza de tela sunscreen; al aterrizar, el contador recibe el impacto y destaca la chance nueva.
- [x] Sustituir la ecualización simulada por Web Audio API (`AnalyserNode`) conectada al mismo stream que graba `MediaRecorder`.
- [x] Cambiar el CTA a `Terminar y guardar`; al detener muestra la onda registrada, `+30 puntos`, el nuevo total y la misma transferencia usada en el resto del flujo.
- [x] Jerarquizar el copy de estrellas, audio y texto en beneficio principal más instrucción secundaria, sin sumar cajas ni acortar información necesaria.
- [x] Probar onda real, guardado, recompensa, trayectoria, colisiones y geometría de las nueve etapas entre 320 y 1920 px.

## 21. Roller persistente como origen de la transición — 2026-07-15

- [x] Eliminar la regla horizontal que quedaba colgada debajo del puntaje.
- [x] Mantener el rollo físico de la cortina a todo el ancho del grid directamente debajo de chances/puntos, sin convertirlo en un objeto 3D decorativo.
- [x] Al cambiar de etapa, bajar desde ese mismo rollo la tela sunscreen sin alterar su ancho.
- [x] Alinear roller, tela, progreso y contenido al mismo grid en mobile y desktop.
- [x] Verificar por cuadro el estado en reposo, el despliegue y el cierre limpio de la transición.

## 25. Corrección de identidad física y jerarquía del ambiente — 2026-07-15

- [x] Corregir el roller corto y brillante: el rollo de cortina permanece full width en reposo y durante la transición.
- [x] Integrar `Seguir sin foto` dentro de la superficie de carga y alinearlo exactamente con el CTA principal.
- [x] Verificar la relación CTA → acción secundaria y el ancho del roller en 320, 390, 768, 1024, 1165, 1280, 1440 y 1920 px.

## 26. Recompensa visible en cada decisión de aporte — 2026-07-15

- [x] Mostrar `+10 puntos` y `+25` en el control para sumar otra foto o video.
- [x] Mostrar `+30 puntos` al iniciar y al terminar una grabación nueva.
- [x] Conservar calificación y texto con su puntaje junto a la acción, sin duplicarlo en CTAs de mero avance.
- [x] Verificar copy y ajuste responsive en mobile y desktop.

## 27. Auditoría del cierre desktop y recompensa por CTA — 2026-07-15

- [x] Llevar el impacto al propio control de foto, video, estrellas, audio, texto y Google.
- [x] Unificar el tratamiento de profundidad de chances y puntos sin quitar la prioridad de chances.
- [x] Eliminar el divisor y las órbitas que se cruzaban detrás del módulo de Google.
- [x] Rediseñar la confirmación de Google con un check vectorial de 48 px, contraste accesible y estado semántico.
- [x] Agregar capturas y regresiones específicas del estado final en desktop y mobile.

## 28. Reequilibrio de portada mobile — 2026-07-15

- [x] Reemplazar `max(100vh,100dvh)` por fallback `100vh` seguido de altura efectiva `100dvh`.
- [x] Evitar que la portada herede los 126 px de padding reservado para el header del flujo en teléfonos bajos.
- [x] Distribuir logo, propuesta, premios y CTA desde el tercio superior en lugar de comprimirlos al fondo.
- [x] Verificar portada sin scroll interno y CTA completo a 320×700, 360×780 y 390×844.

## 29. Handoff Google → Instagram obligatorio — 2026-07-15

- [x] Cambiar la vuelta de Google a `Listo, ya la publiqué`, sin fingir una verificación automática inexistente.
- [x] Registrar la confirmación, duplicar puntos y reemplazar el foco de Google por un CTA grande a Instagram.
- [x] Comunicar fecha, cuenta, tres ganadores y requisito de seguimiento dentro del mismo bloque.
- [x] Mantener un enlace secundario de Instagram antes de Google y ocultarlo cuando aparece el CTA final para evitar duplicación.
- [x] Actualizar bases con requisito, verificación manual del ganador y descargo oficial de Instagram.
- [x] Verificar foco, ancho, copy, enlace y estado en mobile y desktop.

## 30. Auditoría de carga visual, ejes y suavidad — 2026-07-16

- [x] Mantener centradas las etapas de lectura y conservar la carga a la derecha sólo donde permite ver la cortina completa.
- [x] Recentrar ópticamente confirmación y estado final de Instagram sin romper la fila semántica entre logro y autorización.
- [x] Simplificar el CTA de foto a dos columnas y una sola secuencia: acción, guía y recompensa exacta.
- [x] Bajar escalas extremas y distancias del stagger; el roller sigue siendo el gesto dominante de los cambios de etapa.
- [x] Quitar movimiento continuo de números y grano, suavizar el foco de Google y reducir el presupuesto de partículas sin convertir la fiesta en una confirmación plana.
- [x] Separar los estados de copy: primero Google para duplicar chances; después Instagram como último requisito.
- [x] Agregar regresiones para escala de transición, presupuesto de partículas, quietud de las cifras y composición centrada de la confirmación.

## 31. Segunda pasada de cohesión y assets — 2026-07-16

- [x] Unir la fotografía cargada y sus acciones en una sola pieza responsive; el CTA conserva jerarquía derecha en desktop sin quedar flotando.
- [x] Retirar el contador duplicado del encabezado en confirmación y conservar únicamente el roller a ancho completo.
- [x] Quitar la repetición del valor del audio en el copy; `+30 puntos` permanece en los controles que ejecutan la acción.
- [x] Inspeccionar los dos `.rar` aportados y recuperar sus miniaturas internas.
- [ ] Reemplazar el roller CSS por un asset real cuando esté disponible en GLB, glTF, FBX u OBJ; los archivos recibidos son escenas `.max` no convertibles sin 3ds Max.
- [x] Agregar regresiones para la bandeja post-carga y la jerarquía sin puntaje duplicado.

## 32. Roller reconocible y extremos de viewport — 2026-07-16

- [x] Rehacer el roller persistente como una pieza mate a ancho completo, con tela enrollada, soportes laterales y cadena; sin cápsula brillante ni escala horizontal variable.
- [x] Contrastar la anatomía contra los instructivos oficiales de instalación de RollerShow antes de dibujarla.
- [x] Agregar una compuerta durable para 568×320, 844×390, 1024×600 y 1280×640: CTA alcanzable y cero overflow horizontal.
- [x] Mantener la carga a la derecha dentro de la superficie en desktop; no recentrar por uniformidad cuando eso tape el producto.
- [ ] Cambiar la pieza vectorial por un modelo real sólo si llega un export web con licencia clara. Los dos RAR recibidos siguen bloqueados en `.max`; las miniaturas no son publicables.

## 33. Robustez mobile, teclado y peso real — 2026-07-16

- [x] Comprimir fotos antes de previsualizarlas: máximo 1600 px, JPEG q0.82 y reemplazo sólo si el archivo resultante pesa menos.
- [x] Mantener orientación, registrar dimensiones y conservar video sin recomprimir; rechazar videos mayores a 250 MB con error dentro de la carga.
- [x] Probar la compresión con una imagen real de canvas de 2400×1800 y exigir 1600×1200, menor peso, preview y +10 puntos.
- [x] Sacar del arranque las cuatro tarjetas y fotos originales del formulario largo descartado.
- [x] Hacer responsive también las capas animadas y la escena de confirmación; mobile dejó de descargar el hero de 1536 px.
- [x] Bajar la transferencia inicial medida de imágenes de 631 KB a 264 KB.
- [x] Sacar el volver invisible del tab order, transferir foco después de cada cortina y nombrar ambos diálogos.
- [x] Agregar foco visible a Google, Instagram y acciones de modal, con una prueba durable de teclado y semántica.

## 22. Cierre anti-plantilla y premios en alta resolución — 2026-07-15

- [x] Reemplazar el título genérico del cierre por una frase factual que refleja cuántos ambientes mostró la persona.
- [x] Alinear puntaje y autorización como una misma fila semántica, no como dos cajas independientes.
- [x] Hacer transparente el chrome del puntaje en el último paso para que la escena no quede cortada por un rectángulo opaco.
- [x] Regenerar el hero en 1536×1024 con exactamente 3 almohadones y 2 alfombras, y servir una variante responsive de 768 px.
- [x] Agregar regresiones automáticas para copy, transparencia, calidad del asset y alineación interna del cierre.

## 23. Finale Innovatron y foco en Google — 2026-07-15

- [x] Reemplazar la pantalla clara centrada por una escena final profunda y asimétrica.
- [x] Eliminar las cards de puntos/chances y convertir ambos valores en monumentos tipográficos, con chances como logro principal.
- [x] Sustituir 36 piezas DOM por un canvas físico responsive con fibras, cintas y fragmentos de tela; gravedad, drag, profundidad, viento y repulsión ambiental.
- [x] Revelar la escena mediante cinco paños roller que se recogen con timing escalonado.
- [x] Reservar zonas de exclusión para que las partículas pasen por detrás de copy, labels y acciones.
- [x] Hacer que Google tome foco y pulso permanente una vez asentado el festejo.
- [x] Conservar una coreografía alternativa en reduced motion, DPR limitado y cantidad de partículas escalada para mobile.
- [x] Dar volumen persistente a las cifras con capas tipográficas en Z, no sólo una entrada escalada.
- [x] Recalcular el scroll del handoff para que Google quede completo sin cortar la parte superior del logro.

## 34. Eliminación del roller persistente — 2026-07-16

- [x] Eliminar del contador el tubo full width, los soportes y la cadena: seguían pareciendo un objeto 3D de videojuego y no aportaban información ni acción.
- [x] Conservar el gesto de producto únicamente en la transición: la tela sunscreen baja desde el borde superior, cubre y revela la etapa siguiente.
- [x] Prohibir futuras reconstrucciones CSS del mecanismo en reposo. Sólo puede volver con un asset real, aprobado y correctamente integrado.
- [x] Actualizar las pruebas para rechazar cualquier `.score-roller` o `.roller-chain` persistente.

## 35. Calibración óptica y mecanismo real — 2026-07-16

- [x] Validar el color del CTA: el Rojo Teja `#C63A21` era correcto; la sombra marrón y el hover profundo eran lo que ensuciaba su lectura.
- [x] Recalibrar el escenario desktop hasta 420 px y agrupar CTA + salida secundaria en las cinco columnas derechas con centro vertical.
- [x] Comparar ambos modelos convertidos. Elegir la cortina completa de 1,04 MB sobre los tres paños genéricos de 2,97 MB.
- [x] Reconstruir material y luz del modelo, renderizar el mecanismo real a 1600×100 con transparencia y usarlo sólo durante la transición.
- [x] Mantener el asset final por debajo de 16 KB y agregar una regresión que exija sus 1600 px naturales.

## 36. Validación integral y consistencia de audio — 2026-07-16

- [x] Ejecutar el recorrido completo publicado, grilla de 320 a 1920 px, pantallas bajas, movimiento, accesibilidad, performance, desktop y tablet.
- [x] Revisar visualmente portada, ambientes, recompensa, audio, autorización, fiesta final y estado posterior a Google.
- [x] Corregir `Terminar y guardar`: usaba Rojo Teja aunque el módulo de audio está gobernado por verde WhatsApp.
- [x] Unificar botón, pulso y sombra con `--whatsapp-accessible` y agregar una regresión sobre el color computado.

## 37. Mecanismo real ensamblado con la tela — 2026-07-16

- [x] Mantener el mecanismo real fijo y full width durante los pasos 1–7; ocultarlo en portada y cierre para no contaminar esas composiciones.
- [x] Ubicarlo en el aire real entre puntaje y contenido, sin tocar el título en desktop, mobile ni pantallas bajas.
- [x] Hacer que la tela nazca 3 px detrás del tubo y unificar temperatura, trama, transparencia, sombra y barra inferior para que se lea como una sola cortina armada.
- [x] Eliminar la aparición/desaparición del tubo durante el cambio: sólo se despliega la tela.
- [x] Agregar regresiones para persistencia, costura física, separación del contenido y ausencia en portada.

## 38. Fondos de video fluidos y continuos — 2026-07-16

- [x] Detectar que la web había recibido los MP4 crudos de Kling: 5,04 s, 24 fps, 720p/1280p y sin loop, aunque el manifiesto pedía postproceso.
- [x] Convertir las seis variantes en ciclos ping-pong de 10,1 s a 48 fps, sin salto entre último y primer cuadro.
- [x] Llevar desktop a 1440×810 y mobile a 810×1440, con interpolación temporal, limpieza leve de ruido, H.264 y `faststart`.
- [x] Regenerar los seis posters desde los PNG maestros y cargar la escena de confirmación recién al entrar.
- [x] Verificar en Chrome todas las variantes: reproducción activa, `loop`, metadata correcta y cero cuadros perdidos o corruptos.
- [x] Mantener el arranque mobile debajo del gate: 335 KB de imágenes iniciales.

## 39. Retiro del mecanismo y decodificación mobile — 2026-07-16

- [x] Retirar el render completo, incluidos asset, tubo, soportes, brillo y sombra. No queda ningún mecanismo visible en reposo ni durante el cambio.
- [x] Extender el paño a todo el viewport y elevarlo por encima del encabezado: la transición empieza en `top:0`, sobre logo, progreso y puntaje.
- [x] Ocultar `.roller-wipe` al terminar cada cambio; sólo existe visualmente mientras corre `curtain-running`.
- [x] Corregir la exigencia de 48 fps mobile después de medir drops en Pages: mobile queda a 720×1280 y 30 fps sostenidos; desktop conserva 1440×810 y 48 fps.
- [x] Verificar mobile local durante 12 s: 397 cuadros presentados, 0 perdidos y 0 corruptos.

## 40. Eje único para acciones post-carga — 2026-07-16

- [x] Eliminar la grilla desktop asimétrica `1fr / 1.55fr` que dejaba “Agregar otra” a la izquierda y avanzar a la derecha.
- [x] Centrar ambos controles en una sola columna de hasta 640 px, con CTA primario arriba y acción secundaria debajo.
- [x] Reescribir la secundaria como `Agregar más contenido` y separar el impacto: `Foto +10 puntos. Video +25 puntos.`
- [x] Agregar regresiones que exigen eje compartido, orden vertical, unión con la foto y centro respecto de la bandeja.
- [x] Verificar el estado post-carga en 390 y 1280 px, además de 320–1920 y pantallas bajas.

## 41. Tomas cinematográficas reales, sin loop fingido — 2026-07-16

- [x] Regenerar las seis variantes con Kling 3 como tomas continuas de 15 s y movimiento físico de cámara alrededor del ambiente y los premios.
- [x] Rechazar y regenerar dos salidas mobile: una rotaba el horizonte y otra se comportaba como un simple avance de cámara.
- [x] Integrar tres recorridos distintos: apertura del living, arco alrededor de almohadones y alfombras, y pasada baja sobre la textura.
- [x] Eliminar `loop`, ping-pong e interpolación temporal; cada toma conserva los 24 fps nativos y termina quieta en el último encuadre.
- [x] Publicar H.264 `faststart` a resolución nativa útil —1280×720 desktop y 720×1280 mobile—, con posters estáticos y carga diferida de escenas posteriores.
- [x] Verificar en GitHub Pages 15,04 s de duración, encuadre final detenido, cero cuadros corruptos y 2 cuadros perdidos sobre 402 presentados entre desktop y mobile.
- [x] Recorrer el flujo completo de 320 a 1920 px, pantallas bajas, accesibilidad y arranque mobile sin regresiones.

## 42. Sunscreen translúcida en la apertura final — 2026-07-16

- [x] Detectar que los cinco paños del cierre usaban una base beige completamente opaca y que la microtrama sólo estaba dibujada encima.
- [x] Reemplazarla por material transmisivo por alfa, sin `backdrop-filter`: 72% de paso base para conservar ambiente y producto detrás.
- [x] Calibrar hilos verticales y horizontales de bajo contraste, variación de luz y ruido de fibra para que la textura no parezca una cuadrícula digital.
- [x] Mantener paneles, secuencia escalonada y timing del cierre sin afectar la entrega de foco a Google.
- [x] Agregar regresión sobre alfa máximo, trama bidireccional y fibra; verificar flujo, grid y overflow entre 320 y 1920 px.

## 43. Inicio cinematográfico sin salto — 2026-07-16

- [x] Eliminar la espera artificial de 1,4 s que pedía el primer video recién después de `window.load`.
- [x] Declarar las fuentes desktop y mobile dentro del HTML para iniciar la descarga durante el parseo y conservar la carga diferida en las escenas posteriores.
- [x] Regenerar ambos posters desde el cuadro cero exacto de sus MP4 y retirar el zoom autónomo que movía el still antes del empalme.
- [x] Reducir el fundido a 160 ms y reproducir sólo después de `canplay`, sin cambiar encuadre, escala ni composición.
- [x] Agregar una regresión con 1,2 s de demora de red: pedido antes de 500 ms, poster inmóvil, variante responsive correcta y diferencia poster/cuadro cero menor a 2,5%.
- [x] Separar el presupuesto del shell no bloqueante (850 KB) del video progresivo H.264 `faststart` (1,9 MB) para no degradar la toma por perseguir una métrica que ya no representa el arranque visual.

## 44. Auditoría de copy y lectura de video mobile — 2026-07-17

- [x] Auditar todo el recorrido activo con acción y consecuencia primero, voseo natural y una sola idea por bloque.
- [x] Corregir la promesa falsa `duplicá tus chances`: Google duplica puntos y las chances se recalculan; con totales bajos no siempre se duplican.
- [x] Reducir portada, carga, calificación, audio, texto, consentimiento, salida y cierre; eliminar confirmaciones genéricas como `¡Lo hiciste!` y muletillas `Listo,`.
- [x] Confirmar que mobile ya recibe masters verticales propios de 720×1280, no recortes de los videos desktop.
- [x] Mejorar la lectura de los masters actuales reduciendo el velo blanco de portada, recomponiendo el velo de confirmación y levantando detalle en Gracias.
- [ ] Regenerar los tres masters mobile con zonas protegidas para título, CTA y puntaje. Los actuales son verticales, pero ubican producto y movimiento detrás de la interfaz; requiere una nueva generación con proveedor y aprobación de costo.

## 45. Experiencia contextual y borrador completo — 2026-07-17

- [x] Unificar calificación, audio y opinión en una sola etapa anclada por la foto del vendedor.
- [x] Mantener revelado progresivo: las estrellas abren el audio; guardar u omitir el audio abre una opinión breve y opcional.
- [x] Conservar en el mismo contexto escuchar, volver a grabar y borrar el audio, sin avance automático al terminar de grabar.
- [x] Reducir el recorrido a portada + 4 productos + experiencia + confirmación y recalibrar progreso, cierre y pruebas.
- [x] Persistir paso actual, archivos, estrellas, audio y texto con `localStorage` + `IndexedDB`; limpiar el borrador sólo después de confirmar el envío.
- [x] Agregar una regresión que carga una foto, graba audio, escribe, recarga la página y exige reconstrucción completa con 50 puntos.

## 46. Cierre en un fold y celebración más intensa — 2026-07-17

- [x] Eliminar el auto-scroll que empujaba el título al entregar el foco al CTA de Google.
- [x] Recomponer título, puntos, chances, Google, fecha e Instagram dentro del primer viewport en mobile y desktop.
- [x] Multiplicar los estallidos del canvas desde el puntaje y ambos laterales, con mayor tamaño, recorrido y lluvia de fibras.
- [x] Llevar los cinco paños de 28% a 70% de opacidad y reforzar trama vertical, horizontal, ruido de fibra, luz y sombra.
- [x] Incorporar desenfoque controlado de 5 px detrás de los paños y verificarlo en estilo computado.
- [x] Capturar el levantamiento a mitad de animación y exigir por prueba que título, CTA y datos del sorteo permanezcan dentro del fold sin scroll.

## 47. Jerarquía de audio, cierre mobile y rendimiento — 2026-07-17

- [x] Acortar la entrada a `Participar ahora` y reemplazar `Revisar mi participación` por `Continuar`, sin prometer puntos en una acción que sólo avanza.
- [x] Hacer del audio la contribución principal: al guardar u omitir, el CTA aparece antes de la frase opcional, entra centrado en el viewport, recibe foco real y un énfasis transitorio. En desktop queda limitado a 280 px; en mobile conserva el ancho táctil disponible.
- [x] Retirar el doble separador y llevar `¿Querés agregar una frase? (+5 puntos)` a color y peso secundarios, debajo del CTA.
- [x] Ordenar Gracias en un único eje mobile: título, chances/puntos, Google, fecha e Instagram; recuperar el video de fondo con `loop` y contraste estático legible.
- [x] Reprocesar los tres masters mobile a 720×1280 y 30 fps mediante interpolación con compensación de movimiento; bajaron de 8,20 MB combinados a 7,23 MB.
- [x] Precargar la escena siguiente, retirar filtros y blend modes sobre el video final, usar canvas a DPR 1/30 Hz y secuenciar cortinas, video y confeti. El `backdrop-filter` de la ronda 46 queda reemplazado por textura horneada porque producía cuadros descartados.
- [x] Extender la regresión de reproducción a las tres escenas y ambas variantes responsive; desktop sostuvo 23,9–24,9 fps y mobile 29,8–31,0 fps sin corrupción. La prueba integral exige además foco visible después de audio grabado y omitido.
