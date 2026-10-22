# Plan de rediseño visual de la landing (con taste-skill, ui-ux-pro-max e impeccable)

**Fecha:** 2026-10-21 · **Estado:** propuesta para aprobar · Complementa el [plan de refactor del 20-10](2026-10-20-landing-refactor-plan.md), que fijó el mensaje, la audiencia (primero startups) y la conversión (lista de espera). Este documento decide **cómo se ve y cómo se construye**.

**Insumos:**
- Las 4 auditorías de diseño del 20-10.
- La hoja de dirección de taste-skill: `.taste-skill/direction.json`, semilla `963716748`, dirección *The product performs*.
- El sistema de diseño de ui-ux-pro-max: patrón "Trust & Authority + Conversion", estilo "Minimalism & Swiss".
- Las reglas de impeccable.

---

## 1. Por qué hoy se ve mal (diagnóstico medido)

| Problema | Dato |
|---|---|
| Estética cripto: aurora, órbitas, glow, punto "en vivo" | 3 blobs con blur, 4 anillos y 9+ animaciones infinitas |
| Tipografía sin sistema | 21 tamaños; h1 en 5 líneas; mono en el 27 % del texto; 37 etiquetas en mayúsculas espaciadas |
| Texto ilegible | 60 textos de menos de 12 px en móvil (algunos de 6–7 px), incluido el aviso legal |
| Ni una imagen real | 3 maquetas del mismo pasaporte, ninguna pieza de producto |
| Página larga y vacía | 10 pantallas en móvil; huecos de 330 px; una sección fija de 190 svh que no informa nada |
| Fuera del sistema de diseño | ~150 colores hex sueltos; ignora Day/Night; verde distinto al de la app (`#3fd8ca` frente a `#34d399`) |

**Conclusión:** no hay nada que pulir. Se reconstruye la página con una dirección nueva sobre los tokens de `@fondealo/ui`.

## 2. Dirección elegida: *El producto se demuestra solo*

taste-skill propuso tres direcciones: *The product performs*, *Dark room* y *Type only*. Se elige **The product performs** porque es justo lo que pidieron los auditores: en vez de ilustraciones, **fragmentos reales y funcionales del producto a tamaño real**.

> **La idea, en una frase:** en esta página, **la checklist de due diligence que cada fondo o financiador le pide a una startup peruana** se convierte en **una interfaz viva que el visitante completa con su etapa y sus datos**.
>
> **Prueba del competidor:** la frase no funciona para un banco ni para una plataforma de crowdfunding, porque ellos no le dan el expediente a la empresa. Así que la idea es propia de Fondealo.

**La cosa viva:** el visitante elige su etapa (pre-seed, seed o con ingresos) y su país de constitución, y la checklist del hero se reordena y muestra qué documentos suelen pedir y cuáles ya podría tener. Funciona con el pulgar y tiene una versión estática sin JS.

**Ajustes a la hoja.** La skill exige justificar cada cambio:
- **Hero.** La hoja trajo "Controls on the sentence", cuyos controles cambian el peso y el espaciado de la fuente. Esa demo es para una herramienta tipográfica, no para Fondealo. Se usa la composición general de la dirección: titular corto a la izquierda y el fragmento principal a tamaño real a la derecha.
- **Proof.** Se elimina la "fila de logos". No hay socios ni logos reales, y las reglas prohíben inventarlos. En su lugar va **"Lo que Fondealo no hace"**, que es honestidad regulatoria y no prueba social.
- **Imágenes.** No se usan fotos de picsum: dependen de un servidor externo y no aportan. Las imágenes son los fragmentos de interfaz, que para software cuentan como imagen real. Con eso se acepta un posible aviso del inspector sobre el mínimo de fotos.

## 3. Sistema visual

Unifica la marca existente, taste-skill y ui-ux-pro-max. Donde chocan se aplica este orden: reglas de la casa, luego la dirección, luego los tokens.

**Color**
- Solo tokens de `@fondealo/ui`: `surface-0/100/200`, `ink`, `ink-muted`, `brand-fill` / `on-brand`, `line-strong` y `focus-ring`.
- **Cero hex sueltos.** La landing respeta Day/Night. Por defecto queda en Night, igual que la app.
- Un fondo, una tinta y **un acento** (`brand-fill`). El acento va en el CTA, en la fila elegida de la lista de capacidades y en el campo final de la lista de espera.
- Se descarta la paleta oro y violeta de ui-ux-pro-max: el violeta es un tell prohibido y rompería la marca.
- Sin gradientes, glow ni sombras en reposo. Solo lleva sombra lo que flota abierto, como un menú o un diálogo.

**Tipografía**
- Se mantienen Instrument Sans (texto y UI) y Space Grotesk (display). Es lo que pide la dirección: que la landing use la misma tipografía que el producto.
- Fraunces y JetBrains Mono dejan de cargarse en la landing. Mono solo aparece dentro de un fragmento `data-ui`, para un RUC o un hash.
- La alternativa de ui-ux-pro-max (IBM Plex Sans) queda descartada para no tener dos sistemas.
- **Cinco tamaños y no más:**

| Paso | Tamaño | Uso |
|---|---|---|
| display | `clamp(44px, 5vw, 80px)`, interlineado 1,0 | Titulares, como máximo 2 líneas |
| h2 | `clamp(28px, 3vw, 44px)` | Títulos de sección |
| lead | 20–22 px | Frase de apoyo |
| body | 16–17 px, interlineado 1,5, 45–75 caracteres por línea | Texto corrido |
| meta | 14 px | Notas y pie |

- Dentro de los fragmentos se usa el tamaño real de la interfaz: 13–15 px.

**Forma**
- Un solo radio para toda la página, el de `Button` de `@fondealo/ui`.
- Botones planos de al menos 44 px de alto; el CTA principal mide 52 px.
- Márgenes de página de 20 px en móvil y 32 px en escritorio, en una grilla de 12 columnas.

**Prohibido (reglas de taste-skill e impeccable):**
- Etiquetas pequeñas sobre los títulos y numeración 01/02.
- Mono decorativo y mayúsculas espaciadas.
- Líneas finas y tarjetas con ícono encima.
- Vidrio, blobs y palabras de color dentro de los titulares.

## 4. Página, sección por sección

Las alturas son el objetivo en móvil a 375 px. En total, unas 7 pantallas.

| # | Sección (plano de la hoja) | Contenido Fondealo | Fragmento `data-ui` |
|---|---|---|---|
| 1 | **Barra superior** | Wordmark a la izquierda; a la derecha, "Ya tengo cuenta" (enlace) y **"Unirme a la lista"** (botón). Sin barra flotante ni efecto de vidrio. | — |
| 2 | **Hero**: titular a la izquierda + fragmento | h1 de 2 líneas, por ejemplo "Un expediente. / Tú decides quién." (la opción B del plan anterior, a validar). Debajo, una frase sobre startups y MYPE, el botón y el aviso de 14 px: "Fondealo no presta, no invierte ni intermedia inversiones". | **Checklist de expediente** con selector de etapa y país; 6–8 documentos con estado (Listo / Falta / Planeado); un ítem en hover y otro marcado. |
| 3 | **Intro**: frase principal sobre 4 columnas | Frase de 30–40 palabras con el problema ("cada fondo, aceleradora o financiador te pide lo mismo en otro formato"). Las 4 columnas responden: para quién · qué es · qué no es · dónde está hoy (modo de prueba). | — |
| 4 | **Cómo funciona**: fragmento fijo que cambia de estado | 3 frases: "Registra tu empresa." → "Elige qué compartir." → "Compártelo con quien tú elijas." | El mismo panel en 3 estados: formulario vacío → documentos elegidos → invitación de acceso con permiso y "revocar". Los estados se construyen en HTML, nada de capturas. |
| 5 | **Qué incluirá tu expediente**: lista gigante de comandos | Campo de búsqueda real ("Busca un documento") que filtra 6–8 filas: constitución, vigencia de poder, accionistas, situación tributaria, estados financieros, KPIs, historial de pagos. La fila elegida se pinta con el acento y muestra su estado (**Hoy / Planeado**). | Toda la sección es el fragmento. |
| 6 | **Quién lo ve y tus datos** (fila 5/7) | "Nadie lo ve hasta que tú lo compartes. Puedes revocar." Qué se guarda y dónde, con enlace a `/business/datos`. | Panel de permisos: un financiador con acceso, otro revocado y fecha de acceso. |
| 7 | **Lo que Fondealo no hace** (reemplaza a la prueba social) | Una frase grande de declaración más 5 negaciones en texto (no invierte, no presta, no intermedia, no garantiza, no publica startups). | — |
| 8 | **Lo que funciona hoy** | La tabla actual, más corta y apilada como `dl` en móvil, sin Soroban, puntaje ni escrow. | — |
| 9 | **Preguntas**: acordeón de bloques | 6–8 preguntas con `<details name>`: costo, plazo, "¿mi startup queda verificada?", "¿necesito cripto?", datos, MYPE. | — |
| 10 | **CTA**: el primer paso ya abierto | Campo a sangre en `brand-fill`. A la izquierda, "Únete a la lista." y lo que pasa después. A la derecha, **el formulario real de la lista** (`joinWaitlist`) como diálogo del producto. | Formulario: correo, perfil, país, empresa (opcional), consentimiento y entrevista. |
| 11 | **Pie** en una sola línea | "Fondealo · expediente para startups y MYPE" · Privacidad · Términos · Tus datos · Código · © 2026. | — |

**Fuera de la página:** la sección Reputación fija, el "01 / 06 Desliza", las tres maquetas del pasaporte, la tabla de contratos, la aurora y las órbitas.

## 5. Movimiento

1. **Gesto de firma:** al cargar, el titular sube línea por línea desde detrás de su línea base (900 ms, la segunda línea 110 ms después). Es la receta "Masked line reveal" de taste-skill.
2. **Entradas:** las partes de cada sección suben 12–16 px con opacidad, escalonadas 60–90 ms, una sola vez. Es el "Scroll Reveal subtle" de ui-ux-pro-max. Se implementa con IntersectionObserver y CSS; **no se agrega GSAP**.
3. **Respuesta en cada control** (150–250 ms): hover, foco y presión.
4. **La sección "Cómo funciona"** cambia de estado con IntersectionObserver, **sin secuestrar el scroll**. El auditor de accesibilidad pidió no fijar secuencias al scroll, así que se resuelve así:
   - El fijado solo ocurre desde 1024 px.
   - En móvil, sin JS o con `prefers-reduced-motion`, los tres estados se muestran apilados y estáticos.
   - El contenido nunca depende del script para verse.
5. Con `reduce`: `animation: none`, contenido visible al instante y sin desplazamientos.

## 6. Accesibilidad y calidad

Son obligatorios **los 9 criterios del §8 del plan del 20-10**:
- Contraste de 4,5:1 en texto y de 3:1 en foco y bordes, en ambos temas.
- Tamaño mínimo de 12 px.
- Reflow a 320 px.
- `scroll-padding-top`.
- `animation: none` con `reduce`.
- Objetivos táctiles de 44 px.
- `lang` en los términos en inglés.
- Todos los requisitos del formulario: etiquetas, resumen de errores, consentimiento, `role="status"` en el éxito.

Se suman estas reglas de ui-ux-pro-max (pre-delivery checklist): íconos SVG sin emoji, `cursor-pointer`, transiciones de 150–300 ms, layout revisado en 375, 768, 1024 y 1440 px, y CLS < 0,1 reservando el espacio de los fragmentos.

## 7. Cómo se construye (PRs)

Reemplaza los PR 3 y 4 del plan anterior por estos cuatro, cada uno revisable por separado:

| PR | Contenido | Aceptación |
|---|---|---|
| **3a. Base** | Nuevo `app/page.tsx` y `components/landing/*` sobre tokens; tipografía de 5 pasos; barra superior, hero (solo texto), intro, "lo que no hace", "funciona hoy", preguntas y pie; formulario de lista conectado a `joinWaitlist`. Se borra `marketing.module.css`. | 0 hex en la landing; 0 textos < 12 px; ≤7 pantallas a 375 px; titulares ≤2 líneas; tests de render y de strings prohibidos; Lighthouse a11y ≥95 en móvil. |
| **3b. Fragmentos** | Checklist del hero con selector de etapa y país, panel de "cómo funciona" en 3 estados, lista de comandos con filtro y teclado, panel de permisos. Todo con `data-ui` y datos de muestra marcados. | Funcionan con teclado y pulgar; tienen versión sin JS; textos de 13–15 px dentro; un ítem en hover y otro elegido. |
| **3c. Movimiento** | Gesto de firma, entradas, respuesta de los controles y cambio de estado sin secuestrar el scroll. | Ninguna animación infinita; nada invisible más de 400 ms tras entrar en pantalla; con `reduce`, todo estático. |
| **3d. Verificación** | Volver a correr los 4 subagentes; capturas a 375, 768 y 1440 px en Night y Day; checklist de impeccable y de ui-ux-pro-max; revisión de la rúbrica `critique.md` de taste-skill (3 rondas como máximo). | Puntaje de la rúbrica ≥8 (hoy 6,3); 0 hallazgos P0/Blocker en los subagentes. |

**Herramientas y permisos:**
- `search.py` de ui-ux-pro-max y `draw.mjs` de taste-skill son locales y no usan la red; ya se usaron para este plan.
- `inspect.mjs` y `scenes.mjs` de taste-skill abren un Chrome headless, y `assets.mjs` descarga imágenes de internet. **Se piden por separado.** Por defecto, la verificación se hace con el navegador integrado y los subagentes.
- Para el estilo de los fragmentos se puede pedir una hoja de app a taste-skill: `draw.mjs --app --kind <kind> --keep palette,type`.

## 8. Lo que decides tú antes de construir

1. **Titular del hero:** opción B ("Un expediente. / Tú decides quién.") u opción A ("Llega listo / al due diligence."). La recomendación es B en el hero y A como título de la sección para startups.
2. **Tema por defecto:** Night (recomendado, igual que la app) o Day.
3. **Correo de contacto** para financiadores y soporte (`NEXT_PUBLIC_SUPPORT_EMAIL`).
4. **Revisión legal** del texto de consentimiento antes de publicar el formulario.
5. Si autorizas `inspect.mjs` (Chrome headless local) para la verificación del PR 3d.
