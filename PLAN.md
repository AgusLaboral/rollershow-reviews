# PLAN — Rollershow Reviews & Sorteo

> Proyecto nuevo. Web app (mockup primero) para que clientes que YA compraron dejen fotos/video de sus cortinas instaladas + review (estrellas, audio, texto), a cambio de chances en un sorteo mensual de 3 productos de decoración publicado en Instagram.
> Estado: **mockup deployado y verificado** en https://aguslaboral.github.io/rollershow-reviews/ (2026-07-14). Decisiones de Agus: puntos tabla §3, URL /tu-experiencia, participación sin foto sí, hero con la API GPT de Rollershow. Falta: premios reales del mes, foto real de vendedores, integración de Nico (buscar `TODO(Nico)` en index.html).

> Replanteo 2026-07-15: Nicolás rechazó el formulario largo por carga cognitiva. La nueva arquitectura es multistep: portada con un CTA y premios concretos, una cortina por etapa, experiencia separada y confirmación final. Premio comunicado: **3 almohadones + 2 alfombras premium entre 3 ganadores**. Agus marcó que animar una cortina literal puede verse cursi, por lo que se prepararon dos variantes comparables: `?v=ambientes` (profundidad adelante/atrás) y `?v=scroll` (desplazamiento vertical por scroll/swipe). Un MP4 puede usarse después para afinar ritmo, no es dependencia del prototipo.

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
5. **Progreso guardado en el dispositivo** (localStorage) — si cierra y vuelve, no perdió las fotos cargadas ni el audio.
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
- Todas las etapas usan el mismo grid maestro. Producto ocupa columnas 1–7 y 8–12; calificación, audio, texto y confirmación ocupan columnas 3–10. Logo, copy y CTA de portada comparten el borde izquierdo del grid.
- En mobile, las acciones de experiencia dejaron de quedar aisladas al fondo: aparecen inmediatamente después del bloque al que responden.
- `scripts/verify-alignment.mjs` recorre las 9 etapas completas en 320/390/768/1024/1280/1440/1920 px; ya no valida sólo portada y primera cortina.

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
- [x] Aplicar jerarquía por estado: autorización roja y confirmación gris; después, autorización resuelta y confirmación roja.
- [x] Mantener el botón desactivado estable y accesible; el pulso activo cambia luz/sombra, no el área clickeable.
- [x] Sustituir la comparación inventada con un promedio por una consecuencia verificable: cada chance es una oportunidad en el sorteo.
- [x] Verificar los dos estados en mobile y desktop, sin scroll en 320×700 y sin romper el grid de 320 a 1920 px.

## 20. Trayectoria causal, contador reservado y audio real — 2026-07-15

- [x] Reservar una fila completa para chances y puntos debajo del progreso. Ninguna etapa puede comenzar antes de su borde inferior ni usar ese espacio.
- [x] Hacer que `+10`, `+25`, `+5` o `+30` nazca en la acción y viaje hasta el total con una pieza de tela sunscreen; al aterrizar, el contador recibe el impacto y destaca la chance nueva.
- [x] Sustituir la ecualización simulada por Web Audio API (`AnalyserNode`) conectada al mismo stream que graba `MediaRecorder`.
- [x] Cambiar el CTA a `Terminar y guardar`; al detener muestra la onda registrada, `+30 puntos`, el nuevo total y la misma transferencia usada en el resto del flujo.
- [x] Jerarquizar el copy de estrellas, audio y texto en beneficio principal más instrucción secundaria, sin sumar cajas ni acortar información necesaria.
- [x] Probar onda real, guardado, recompensa, trayectoria, colisiones y geometría de las nueve etapas entre 320 y 1920 px.

## 21. Roller persistente como origen de la transición — 2026-07-15

- [x] Eliminar la regla horizontal que quedaba colgada debajo del puntaje.
- [x] Mantener un cilindro roller gris con volumen leve directamente debajo de chances/puntos.
- [x] Al cambiar de etapa, desplegar ese mismo cilindro hasta el ancho del grid y bajar desde ahí la tela sunscreen.
- [x] Alinear roller, tela, progreso y contenido al mismo grid en mobile y desktop.
- [x] Verificar por cuadro el estado en reposo, el despliegue y el cierre limpio de la transición.

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
