# Plan de refactor de la landing: primero startups

**Fecha:** 2026-10-20 · **Rama base:** `feat/es-first-status-consent` · **Estado:** propuesta, pendiente de aprobación.

**Insumos:**
- Cuatro auditorías de los subagentes de `.claude/agents/`: UX fintech, diseño visual, accesibilidad y contenido en español.
- La [auditoría estratégica del 19-10](2026-10-19-strategy-audit.md).
- Investigación del ecosistema peruano de startups (fuentes en §12).

**Etiquetas:** **[E]** evidencia · **[H]** hipótesis a validar · **[L]** requiere revisión legal.

---

## 1. Resumen

- **Decisión de alcance:** rediseño completo de la landing, sin cambiar de stack. Se reconstruye sobre los tokens y componentes de `@fondealo/ui`. La recomendación es unánime entre auditores por tres razones:
  1. Cambian la audiencia, la conversión y las secciones, así que no basta con retocar textos.
  2. Los recursos que hoy dan identidad a la página (aurora, órbitas, glow, monospace, numeración 01/02 y tres maquetas del pasaporte) son los mismos que la hacen leer como cripto [E].
  3. `marketing.module.css` tiene 1.737 líneas, ~150 colores hex fijos, ignora el tema Day/Night y usa un verde distinto al de la app [E]. Reconstruir cuesta menos que corregir regla por regla.
- **Mensaje nuevo:** Fondealo ayuda a una startup o MYPE a **preparar una vez su expediente y compartirlo, con su permiso, con quien ella elija**.
- **Regla que gobierna todo el copy:** *Fondealo ayuda a preparar y compartir; nunca presenta, selecciona ni recomienda startups* [L].
- **Conversión única:** unirse a la lista de acceso anticipado, sin crear cuenta ni billetera.
- **Antes de publicar:** actualizar el §8 de la estrategia (hoy no cubre startups ni inversionistas de equity) y pasar el texto por revisión legal [L].

## 2. Decisiones ya tomadas (2026-10-20)

| Tema | Decisión |
|---|---|
| Audiencia | Primero startups; las MYPEs quedan como segundo camino. |
| Startups objetivo | (1) Pre-seed/seed que se preparan para el due diligence de inversionistas, fondos y aceleradoras. (2) Startups con ingresos que buscan financiamiento sin ceder acciones (factoring, basado en ingresos, deuda) con entidades autorizadas. |
| Acción principal | Lista de acceso anticipado. |
| Profundidad visual | Se decidió con la auditoría: rediseño completo (§1). |

## 3. Qué encontró la auditoría (lo esencial)

**Mensaje y recorrido [E]**
- El hero, el nav y los metadatos le hablan solo a la MYPE. En toda la página no aparecen "startup", "due diligence" ni "financiamiento no dilutivo".
- Hay cinco CTA con cinco etiquetas distintas, y todos llevan al onboarding: login con Privy, creación de billetera, un rol irreversible y el wizard KYB. Eso pide datos sensibles para un producto que aún no entrega nada.
- "Ver cómo funciona el Pasaporte" abre un login, y la tarjeta para financiadores lleva a GitHub.
- El wizard KYB no sirve para startups: no tiene la opción "sin ingresos" ni contempla holdings en Delaware o empresas aún no constituidas.

**Afirmaciones y riesgo [E][L]**
- Textos como "ACTIVIDAD VERIFICADA", "Historial de pagos" o "Identidad crediticia", y el punto verde de "en vivo", contradicen el modo de prueba.
- "Escrow", "USDC", "Soroban" y "puntaje" se leen como custodia de fondos o como una central de riesgo. "Oportunidades" promete un resultado.
- Con la nueva audiencia, hablar de "conectar con inversionistas" o mostrar startups verificadas se acerca a ofrecer valores al público. La auditoría estratégica no analizó ese caso [L].

**Diseño [E]** (medido en vivo a 375 px y a 1440 px)
- La página mide 8.197 px en móvil, unas 10 pantallas.
- Hay 60 textos de menos de 12 px; algunos llegan a 6–7 px en móvil. El aviso "no garantiza financiamiento" mide 10 px.
- Se usan 21 tamaños de fuente. El h1 ocupa 5 líneas tanto en móvil como en escritorio.
- La tipografía mono cubre el 27 % del texto y hay 37 etiquetas en mayúsculas espaciadas.
- En móvil, la tabla de estado mide 630 px en un espacio de 335 px, así que la columna "Estado" queda fuera de la pantalla.
- Todas las imágenes son ilustraciones; no hay ni una pieza de producto real.

**Accesibilidad [E]**
- El anillo de foco menta tiene un contraste de 1,5:1 en las secciones claras.
- Con "movimiento reducido" activado, las animaciones infinitas siguen corriendo a 0,01 ms, lo que puede producir parpadeo.
- El header fijo tapa el foco.
- Cinco pares de colores en textos pequeños no llegan a 4,5:1 (van de 3,69 a 4,39).
- El contenido que se revela al hacer scroll puede seguir invisible cuando recibe foco o al imprimir.
- `overflow: clip` en la raíz puede recortar el texto a 320 px.

**Qué conservar**
- La honestidad de producto como contenido: la tabla "Lo que funciona hoy" y "la decisión es del financiador".
- La arquitectura de movimiento: la página se renderiza en el servidor, se lee sin JS y respeta reduced-motion.
- El skip link, la tabla con `caption`, el logo (`orbital-badge.png`), Instrument Sans y Space Grotesk, y la alternancia de fondos noche y papel.

## 4. Posicionamiento y mensaje

**Hero recomendado** (opción B del auditor de contenido, la más defendible):
- Titular: **"Un expediente. Tú decides quién."**
- Apoyo: "Para startups que preparan una ronda o buscan financiamiento sin ceder acciones, y para MYPE que piden crédito. Versión de prueba."
- CTA: **"Unirme a la lista de espera"**

La opción A, **"Llega listo al due diligence."**, pasa a ser el titular de la sección para startups. Antes de cerrar el hero, ambas opciones se prueban con fundadores en un test de 5 segundos [H].

**Lo que la página promete (y es verdad hoy o queda marcado como "planeado"):**
- Ordenar una vez los datos y documentos de la empresa.
- Decidir quién los ve, y poder revocar el acceso.
- Ver qué está verificado, con su fuente y su fecha (por ahora en modo de prueba).

**Lo que la página nunca dice [L].** Esta lista se convierte en un test automático:
- invertir, inversión, oportunidad de inversión, levanta tu ronda
- retorno, rentabilidad, garantizado, deal flow
- conectamos con inversionistas, inversionistas verificados
- startup aprobada o verificada (si no hay decisión real), puntaje, score
- escrow, USDC

**Glosario:**

| Usar | Para qué | Evitar |
|---|---|---|
| Pasaporte de Empresa | El producto | — |
| expediente | Su contenido | identidad portable, identidad crediticia |
| verificación | Siempre con fuente y fecha | — |
| evaluación | Es del financiador, nunca de Fondealo | — |
| financiador | Quien financia | — |
| inversionista | Solo como contexto del fundador | inversor; nunca como rol de usuario |
| financiamiento sin ceder acciones | — | non-dilutive |
| modo de prueba / red de prueba de Stellar, sin dinero real | — | sandbox, Testnet |
| lista de espera | El CTA | waitlist |

Términos en inglés que se mantienen: startup, pre-seed/seed, due diligence (explicado la primera vez), deck, fintech y factoring. Se evita "runway", y "venture debt" no se usa como oferta propia.

**Pendiente con fundadores [H]:** si "Pasaporte" sugiere un documento oficial del Estado, conviene probarlo contra "Expediente Fondealo" antes de renombrar el producto.

## 5. Arquitectura de información

El objetivo es pasar de unas 10 pantallas a 7 o menos en móvil, con el formulario a no más de 2 pantallas del hero.

| # | Sección | Mensaje | Prueba disponible hoy |
|---|---|---|---|
| 1 | Header | Nav: Cómo funciona · Qué incluye · Tus datos · Preguntas. CTA "Unirme" y enlace "Ya tengo cuenta". | — |
| 2 | Hero | Opción B, con el CTA y un aviso ≥14 px junto al botón. A la derecha, un fragmento real de la interfaz del expediente (§6). | Ninguna del resultado final; se declara "En desarrollo". |
| 3 | Dos caminos | "Preparo una ronda pre-seed/seed" / "Tengo ingresos y busco financiamiento sin ceder acciones", con enlace a la MYPE. | Foco de producto [H] |
| 4 | Problema | "Cada fondo, aceleradora o financiador te pide lo mismo en otro formato." | Hipótesis [H]; sin cifras ni testimonios inventados. |
| 5 | Qué incluirá tu expediente | Lista concreta (constitución, poderes, accionistas, situación tributaria, finanzas), cada ítem con estado **Hoy / Planeado**. | Registro con reglas tributarias de 6 países y evidencia declarada (modo de prueba). |
| 6 | Quién lo ve | "Nadie lo ve hasta que tú lo compartes. Tú eliges a quién. Puedes revocar. Fondealo no publica ni recomienda startups." | `/business/datos` y consentimiento versionado. Compartir con terceros: planeado. |
| 7 | Tus datos y seguridad | Qué se guarda y dónde (proveedores fuera del Perú [L]); nada sensible va a blockchain. | `operating-model.md`, commitments con sal. No prometer cifrado de extremo a extremo. |
| 8 | Lo que Fondealo no hace | No invierte, no presta, no intermedia, no garantiza aprobación ni publica oportunidades. | `NOT_A_FINANCING_PROMISE` |
| 9 | Lo que funciona hoy | Tabla corta, apilada en móvil, sin Soroban, puntaje ni escrow. | La tabla actual, reducida. |
| 10 | Para fondos, aceleradoras y financiadores | "Buscamos socios piloto que reciban expedientes con el consentimiento de la empresa." | Contacto por correo o perfil "financiador" en la lista. |
| 11 | Preguntas frecuentes | Costo, plazo ("sin fecha"), "¿mi startup queda verificada?" (todavía no), "¿necesito cripto?" (no). | — |
| 12 | Lista de espera | Formulario (§7). | Por construir. |
| 13 | Footer | Privacidad · Términos · Tus datos · contacto · razón social · enlace MYPE · código. | Falta el aviso de privacidad público [L]. |

**Se elimina:** la sección "Reputación" fija de 190 svh, el bloque "01 / 06 Desliza…", las tres maquetas del pasaporte y la tabla de contratos.

## 6. Dirección visual

**Qué se va:**
- Aurora, órbitas, halo, `glowPulse`, `ringSpin`, el punto "en vivo" y el glow de la barra de progreso.
- Monospace decorativo, etiquetas pequeñas sobre los títulos y numeración 01/02.
- Palabras de color dentro de los titulares, revelados con blur o escala y el pin de scroll.

**Sistema:**
- **Tokens:** `surface-*`, `ink` / `ink-muted`, `brand-fill` / `on-brand`, `line-strong` y `focus-ring`. Cero hex fijos. Si la marca quiere la landing siempre oscura, se envuelve en `.fdo-island`; si no, respeta Day/Night. *Decisión pendiente (§11).*
- **Tipografía:** dos familias (Instrument Sans y Space Grotesk) y como máximo 5 tamaños. Cuerpo de 16–18 px, piso de 12 px y avisos legales ≥14 px. Titulares de unos 32 caracteres que no pasen de 2 líneas en 375, 768 ni 1440 px. Mono solo para identificadores reales.
- **Componentes:** `Button`, `Field`, `Badge` y `TxStatus` de `@fondealo/ui`. Un solo radio de borde y botones ≥44 px.
- **Imagen:** **un** fragmento real de interfaz como pieza central: la checklist de due diligence con estados, hecha con `Badge` y datos de muestra marcados `data-ui`.
- **Algo interactivo:** el visitante elige su etapa (pre-seed, seed o con ingresos) y ve qué documentos se suelen pedir. Debe funcionar con el pulgar y tener una versión estática sin JS.
- **Movimiento:** entradas cortas de 16–24 px en opacidad, una sola vez por elemento, y un único gesto con propósito (ítems de la checklist que pasan a "listo"). Se reutiliza la estructura de `marketing-motion.tsx`.

**Uso de las skills.** Se aplicarán las reglas de **taste-skill**, **impeccable** y **ui-ux-pro-max** a mano. Sus scripts de terceros (Chrome headless, búsqueda de imágenes) **no** se ejecutan sin aprobación. La verificación visual se hace con el navegador integrado y con los subagentes.

## 7. Lista de espera

**Campos.** Se pide lo mínimo (Ley 29733, principio de finalidad):

| Campo | Obligatorio | Razón |
|---|---|---|
| Correo | Sí | Es el único canal para avisar. |
| Perfil: startup pre-seed/seed · startup con ingresos · MYPE · fondo/aceleradora/financiador · otro | Sí | Prioriza qué construir primero y separa a los financiadores. |
| País de constitución: Perú · EE.UU./Delaware · otro · aún no constituida | Sí | Dice si el registro actual (6 países) aplica. Es el principal riesgo de encaje [H]. |
| Nombre de la empresa | No | Deduplicar y personalizar. |
| Consentimiento, sin marcar por defecto, con enlace a la política | Sí | Guardar la versión del texto y la fecha. Texto para revisión legal [L]. |
| "Acepto una entrevista de 30 min" | No | Recluta para validar las hipótesis de §10. |

**No se pide:** RUC, ingresos, monto que se busca, cap table, teléfono, documentos ni billetera.

**Seguridad y comportamiento:**
- Server action con zod.
- Honeypot y límite de envíos por IP o correo.
- Si el correo ya existe, se muestra **el mismo mensaje de éxito**, para no revelar quién está inscrito.
- La lista no crea `UserWallet` ni `KybSubmission`.
- Baja en un clic.

**Microcopy:**
- Botón: "Unirme a la lista de espera". Bajo el botón: "Unirte a la lista no es una solicitud de financiamiento. Fondealo no presta, no invierte ni intermedia inversiones."
- Éxito: "¡Listo, ya estás en la lista! Te escribiremos a {correo} cuando abramos el acceso."
- Los mensajes de error están en el informe de contenido.

**Almacenamiento: decisión pendiente (§11).**
- **Opción recomendada:** una tabla propia `WaitlistEntry` mediante una migración aditiva. Sigue las puertas de `docs/operating-model.md`: primero el entorno de desarrollo aislado y luego producción con autorización.
- **Alternativa:** un proveedor externo de formularios. Suma un tercero que también trata datos personales [L].

## 8. Criterios de accesibilidad (aceptación)

1. **Contraste:**
   - Texto ≥4,5:1, o ≥3:1 si mide ≥24 px.
   - Bordes de campo, checkbox y foco ≥3:1 contra **cada** fondo, en ambos temas.
   - Usar `line-strong` y nunca `line` en controles.
2. **Tipografía:** piso de 12 px y avisos ≥14 px, en rem.
3. **Reflow:**
   - A 320 px, con zoom al 200 % y con espaciado de texto aumentado, no se recorta nada ni aparece scroll horizontal.
   - Sin `overflow: clip` en la raíz.
4. **Teclado y foco:**
   - Orden lógico y foco visible.
   - `scroll-padding-top` para que el header no tape el foco.
   - El skip link sigue siendo el primer elemento enfocable.
5. **Movimiento:**
   - Con `reduce`, `animation: none`.
   - Nada automático dura más de 5 s.
   - Ningún contenido depende de IntersectionObserver para verse; también se revela con foco e impresión.
6. **Semántica:**
   - Un solo h1 y un h2 por sección.
   - Listas reales e ilustraciones con `aria-hidden`.
   - El CTA principal va dentro de `main`.
7. **Objetivos táctiles:** ≥44 px en el CTA, el envío y el checkbox en móvil.
8. **Idioma:**
   - Todo en español, con `lang="en"` donde se mantenga un término en inglés.
   - Enlaces externos anunciados como tales.
   - El modal de Privy configurado en español.
9. **Formulario:**
   - `<label>` visible y `autocomplete="email"`.
   - Errores al enviar, en un resumen con `role="alert"` y enlaces a cada campo, más `aria-invalid` y `aria-describedby`. Se conservan los valores escritos.
   - El botón nunca se deshabilita antes de enviar y muestra "Enviando…".
   - Éxito persistente en `role="status"` con foco en su encabezado.
   - Sin CAPTCHA visual.

## 9. Plan de implementación (PRs pequeños y reversibles)

| PR | Contenido | Archivos | Aceptación | Riesgo / dependencia |
|---|---|---|---|---|
| **0. Docs** | Actualizar el §8 de la estrategia para startups; agregar el glosario; iniciar la revisión legal. | `docs/strategy/*` | Fundadores aprueban el posicionamiento. | Necesita abogado [L] |
| **1. Contención en la landing actual** (opcional y rápido, porque la página está en línea) | Quitar "ACTIVIDAD VERIFICADA", el punto en vivo, escrow/USDC/Soroban y "rentabilidad"; avisos a ≥14 px; `animation: none` con reduce; foco oscuro en secciones claras; `scroll-padding-top`; un solo `metadataBase`; financiadores sin enlace a GitHub. | `page.tsx`, `marketing.module.css`, `layout.tsx` | Test de strings prohibidos pasa; axe sin `color-contrast`. | Bajo; se descarta si el PR 3 llega pronto. |
| **2. Lista de espera (backend)** | Modelo `WaitlistEntry` y migración aditiva, server action, honeypot, límite de envíos, versión del consentimiento, misma respuesta si el correo está duplicado. Tests de validación, duplicados, sin sesión y base de datos caída. | `packages/database/prisma/*`, `lib/actions/waitlist.ts`, tests | Ningún envío crea `UserWallet` ni `KybSubmission`. | Migración: puertas del operating-model; decidir almacenamiento (§11). |
| **3. Nueva landing: estructura y copy** | Nuevo `page.tsx` con las secciones de §5 sobre tokens y `@fondealo/ui`, todavía sin movimiento; formulario conectado; test de render y de strings prohibidos. | `app/page.tsx`, CSS nuevo, `components/landing/*` | Test de 5 s con ≥10 fundadores: ≥80 % entiende qué es y que "no invierte ni presta". | Copy con revisión legal |
| **4. Pulido visual y accesibilidad** | Fragmento de interfaz en el hero, el selector de etapa, un gesto de movimiento, revisión en Day/Night; volver a correr los 4 subagentes. | `components/landing/*`, `marketing-motion.tsx` | Lighthouse a11y ≥95 en móvil; 0 textos <12 px; ≤7 pantallas a 375 px; titulares ≤2 líneas. | — |
| **5. Limpieza y onboarding** | Borrar el `marketing.module.css` antiguo; "Ya tengo cuenta" como única entrada al login; confirmar el rol sin clic cuando hay una sola opción; ícono neutro en lugar de billetera; Privy en español; traducir el error de `use-stellar-wallet.ts`. | `onboarding-flow.tsx`, `privy-*`, `hooks/*` | Un usuario existente llega a `/business` en 2 clics desde `/`. | — |

Orden sugerido: **0 → 2 → 3 → 4 → 5**. El PR 1 solo se hace si la nueva landing tardará más de una o dos semanas.

## 10. Validación (antes y durante la construcción)

- **Entrevistas:** 10 fundadores (pre-seed/seed y con ingresos) y 5 personas del otro lado (ángeles o fondos de PECAP, una aceleradora y un financiador). Preguntas:
  1. ¿Repites la recopilación de documentos con cada ronda o financiador? ¿Cuántas horas te toma? [H]
  2. ¿Aceptarías un expediente preparado por un tercero? ¿Qué datos volverías a verificar tú? [H]
  3. ¿Dónde está constituida tu startup (Perú, Delaware u otro país)? [H]
- **Test de 5 s** del hero: opción B frente a opción A.
- **Métricas de la lista** (una vez instrumentadas): visitas que se inscriben, proporción por perfil y por país, aceptación de entrevistas, y financiadores o fondos inscritos.

## 11. Decisiones pendientes

1. Hero definitivo: B o A, después del test de 5 s.
2. Nombre del producto: "Pasaporte de Empresa" o "Expediente".
3. Almacenamiento de la lista: tabla propia (recomendada) o proveedor externo.
4. Tema de la landing: siempre oscura (`.fdo-island`) o adaptable a Day/Night.
5. Correo de contacto para financiadores y soporte (`NEXT_PUBLIC_SUPPORT_EMAIL`).
6. Revisión legal: §8 de la estrategia, texto de consentimiento, política de privacidad y la línea sobre inversionistas.
7. Si se hace el PR 1 de contención mientras llega el rediseño.

## 12. Fuentes del contexto de mercado

- [COFIDE–PECAP, diagnóstico de venture capital (jun. 2026)](https://www.cofide.com.pe/wp-content/uploads/2026/06/NP-COFIDE-y-PECAP-presentan-informe.pdf): 23 inversiones por US$ 76,5 M; la deuda fue el 72 % del monto; brecha de unos US$ 516 M a 5 años. El año exacto de la cifra no se verificó.
- [ecosistemastartup: el VC crece 63 % y PECAP busca LPs](https://ecosistemastartup.com/?p=117002): el 93,7 % del capital de los fondos que invierten en Perú viene del extranjero (secundaria).
- [Nathan Lustig, panorama del VC en Perú](https://www.nathanlustig.com/peru-venture-capital-overview/): redes de ángeles, Salkantay, UTEC Ventures y el programa Investment Readiness Perú de PECAP (data room).
- [Techloy, Prestamype US$ 27 M en equity y deuda](https://www.techloy.com/latin-americas-biggest-startup-funding-rounds-in-week-13-led-by-prestamype-with-big-bets-on-fintech-and-ai.md).
- [Resolución SMV 2025 (oferta privada)](https://cdn.www.gob.pe/uploads/document/file/8135493/6814630-resolucion-sasp-n-006-2025-smv.pdf): define cuándo una oferta de valores es privada [L].
- Marco regulatorio general: §5 y §13 de la [auditoría estratégica](2026-10-19-strategy-audit.md).

No se verificó: proveedores de financiamiento basado en ingresos activos en Perú; la lista vigente de miembros de PECAP; los requisitos concretos del due diligence de cada fondo.
