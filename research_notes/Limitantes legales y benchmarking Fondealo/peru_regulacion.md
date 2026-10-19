# Marco legal y regulatorio en Perú aplicable a Fondealo (estado a octubre 2026)

> Nota metodológica: investigación hecha el 19-oct-2026 solo con búsqueda web. La herramienta de lectura de páginas no pudo resolver dominios peruanos (smv.gob.pe, gob.pe, elperuano.pe, gestion.pe, sbs.gob.pe), así que **no se leyó el texto íntegro de ninguna norma**. Los datos vienen de fragmentos de resultados de búsqueda (fuentes oficiales cuando aparecieron, si no estudios de abogados y prensa). Se marca **[Verificar]** lo que viene solo de fuentes secundarias y **[Conocimiento previo, sin fuente]** lo que no se pudo citar (esos puntos están en "Gaps" o "Inferences"). UIT 2026 = S/ 5,500 (D.S. 301-2025-EF), lo que sirve para pasar a soles los límites expresados en UIT.

---

## 1. Financiamiento participativo financiero (FPF / crowdlending): ¿Fondealo necesita autorización SMV?

### Takeaway
Sí. El modelo "inversionistas financian oportunidades de negocios a través de una plataforma esperando retorno" es exactamente la actividad de FPF que define el D.U. 013-2020 (art. 18). Para hacerlo hay que constituir una Sociedad Administradora autorizada por la SMV, con un capital mínimo de unos S/ 350 mil, límites por proyecto, receptor e inversionista, y fondos canalizados por cuentas segregadas que la plataforma no administra directamente. El caso más reciente documentado (Prestópolis) tomó unos 17 meses desde la autorización de organización hasta la de funcionamiento. Además, el esquema de custodia que exige el reglamento (escrow en entidad SBS, fideicomiso o dinero electrónico) no contempla un escrow en smart contract con USDC.

### Cited Findings
**Norma base**
- El D.U. 013-2020 ("que promueve el financiamiento de la MIPYME, emprendimientos y Startups") crea el marco para regular y supervisar el FPF y a las sociedades que administran las plataformas. Su art. 18 define la actividad como aquella en la que, a través de una plataforma, se pone en contacto a receptores que piden financiamiento con inversionistas que buscan un retorno financiero. El mismo artículo excluye ciertas actividades de personas jurídicas que conectan partes por medios digitales y que quedan fuera de la supervisión SMV — [vLex D.U. 013-2020](https://vlex.com.pe/vid/839239378); [EY Perú](https://www.ey.com/es_pe/insights/law/beneficios-financiamiento-mipymes)
- Para constituirse como Sociedad Administradora se necesita autorización de la SMV, y existe un registro especial público. Las sociedades autorizadas se inscriben en el Registro Público del Mercado de Valores, sección "Financiamiento Participativo Financiero" — [EY Perú](https://www.ey.com/es_pe/insights/law/beneficios-financiamiento-mipymes); [Inversiones.io – Regulación SMV](https://inversiones.io/regulaciones/smv-3/)
- El D.U. obliga a advertir a los inversionistas que los receptores no están supervisados por la SMV y que pueden perder parte o todo su capital. Permite servicios adicionales, como la cobranza, si el inversionista da su consentimiento de forma indubitable — [EY Perú](https://www.ey.com/es_pe/insights/law/beneficios-financiamiento-mipymes)
- La Res. SMV 005-2020-SMV/01 fijó un régimen transitorio para las empresas que ya hacían FPF por préstamos cuando entró en vigencia el Título IV del D.U. — [El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/1865616-1); [Garrigues](https://www.garrigues.com/es_ES/noticia/peru-regula-regimen-transicion-empresas-dedicadas-financiamiento-participativo-traves)
- **Reglamento:** Res. de Superintendente N° 045-2021-SMV/02, publicada en El Peruano el 20-may-2021, "Reglamento de la Actividad de FPF y sus Sociedades Administradoras" — [El Peruano](https://elperuano.pe/NormasElperuano/2021/05/20/1954665-1/1954665-1.htm); [texto SMV (PDF)](https://www.smv.gob.pe/ConsultasP8/temp/RSUP%20045-2021%20-%20Aprobaci%c3%b3n%20Reglamento%20FPF.pdf); [Rubio Leguía](https://www.rubio.pe/alerta/reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras-resolucion-de-superintendente-n-045-2021-smv-02/); [CMS Grau](https://cms.law/es/per/publication/smv-emite-el-reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras); [Garrigues](https://www.garrigues.com/es_ES/noticia/peru-emite-reglamento-actividad-financiamiento-participativo-financiero-o-crowdfunding)

**Capital y patrimonio**
- El capital social mínimo base es S/ 300,000, íntegramente suscrito y pagado en efectivo, y se reajusta cada año según el índice de precios al por mayor (INEI). El patrimonio neto debe ser igual o mayor al capital mínimo, con porcentajes transitorios en los primeros 24 meses: 70% el primer año y 80% el segundo — [EY – Reglamento FPF](https://www.ey.com/es_pe/insights/law/reglamento-financiamiento-participativo-financiero); [Rubio Leguía](https://www.rubio.pe/alerta/reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras-resolucion-de-superintendente-n-045-2021-smv-02/)
- Monto actualizado: S/ 357,000 en 2024 según Gestión ([Gestión](https://gestion.pe/tu-dinero/smv-autoriza-funcionamiento-de-la-quinta-plataforma-de-crowdfunding-financiamiento-participativo-financiero-noticia/)) y S/ 352,127.37 en 2025 según el comunicado SMV de ese año ([SMV – Comunicado FPF 2025](https://www.gob.pe/institucion/smv/noticias/1087133-comunicado-sobre-la-actividad-de-financiamiento-participativo-financiero-2025)). No se encontró la cifra de 2026. **[Verificar]**
- Incumplir el patrimonio mínimo lleva a suspensión. A Inversiones Neurona (antes Bloom Crowdfunding, autorizada en sept-2023) la suspendieron en 2025 por no cumplir el patrimonio neto mínimo, y luego pidió la cancelación, otorgada por Res. 022-2026-SMV/02 — [Revista Gana Más](https://revistaganamas.com.pe/smv-cancela-autorizacion-de-inversiones-neurona-como-plataforma-de-financiamiento-participativo/); [Gestión](https://gestion.pe/economia/empresas/smv-cancela-autorizacion-de-la-plataforma-de-crowdfunding-inversiones-neurona-noticia/)

**Límites (texto 2021)**
- Proyecto personal: hasta 50 UIT y plazo de hasta 3 años. Proyecto empresarial: hasta 500 UIT — [EY](https://www.ey.com/es_pe/insights/law/reglamento-financiamiento-participativo-financiero); [Rubio Leguía](https://www.rubio.pe/alerta/reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras-resolucion-de-superintendente-n-045-2021-smv-02/)
- Límite por receptor: 100 UIT si es persona natural y 750 UIT si es persona jurídica — [Revoredo](https://revoredo.pe/en/sobre-el-reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras/); [SmartLaw](https://smartlaw.com.pe/blog/2021/05/27/resumen-del-reglamento-de-financiamiento-participativo-financiero/) **[Verificar]**
- Inversionista no institucional: no puede aportar más del 20% del monto total de un proyecto, ni más del 20% de sus ingresos anuales o de su patrimonio de los últimos 12 meses (se usa el mayor de los dos). Al inversionista institucional no le aplican esos topes, pero la plataforma debe asegurar pluralidad: nunca puede haber un único inversionista por proyecto. La administradora puede fijar límites más bajos en sus reglamentos internos — [EY](https://www.ey.com/es_pe/insights/law/reglamento-financiamiento-participativo-financiero); [Rubio Leguía](https://www.rubio.pe/alerta/reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras-resolucion-de-superintendente-n-045-2021-smv-02/)

**Modificación de 2025 (vigente)**
- La Res. SMV N° 019-2025-SMV/01 (firmada el 12-nov-2025 y publicada en El Peruano el 14-nov-2025) modifica el Reglamento 045-2021. Su proyecto previo fue la Res. SMV 015-2025-SMV/01 (04-oct-2025) — [El Peruano NL 2458521-1](https://busquedas.elperuano.pe/dispositivo/NL/2458521-1); [Actualidad Empresarial](https://actualidadempresarial.pe/norma/resolucion-smv-019-2025-smv-01/aa221925-6bfd-436a-9727-264773a38042); [Estudio Rodrigo – Alerta oct-2025](https://www.estudiorodrigo.com/publicaciones/alerta-mercado-de-capitales-octubre-2025)
- Según fuentes secundarias, sube el tope por proyecto empresarial de 500 a 1,000 UIT (S/ 5.5 MM en 2026) y el tope por receptor de 750 a 1,500 UIT, siempre que la metodología de la administradora incluya variables específicas de riesgo. Además permite, por primera vez, financiar proyectos empresariales que se ejecuten fuera del Perú, con condiciones: el receptor debe haber financiado al menos un proyecto en una plataforma autorizada en los últimos 24 meses, no tener moras, acreditar 4 o más años de operación en Perú y no tener deudas vencidas a más de 120 días ni más de 50% de deuda dudosa. Se excluyen los países sancionados o de alto riesgo LA/FT — [RegAlert (resumen)](https://regalert.today/document/resolution-smv-no-019-2025-smv-01-fc364640-5092-420c-a645-2ea0f65f740b); [IUS Latin](https://iuslatin.pe/reglamento-de-financiamiento-participativo-2025-principales-cambios-realizados-por-de-smv/); [El Peruano – nota](https://www.elperuano.pe/noticia/283044-preparate-para-los-cambios-la-smv-actualiza-el-reglamento-de-financiamiento-participativo) **[Verificar en el texto oficial]**

**Custodia y flujo de fondos**
- La administradora debe separar las cuentas con recursos propios de las cuentas por donde pasan los fondos de receptores e inversionistas. Esas cuentas **no pueden ser administradas directamente por la Sociedad Administradora**. Los mecanismos admitidos son cuentas escrow de entidades autorizadas por la SBS, fideicomisos y cuentas de dinero electrónico de emisores autorizados bajo la Ley 29985. Está prohibido recibir los fondos de clientes en las mismas cuentas de recursos propios, igual que dar préstamos o garantías a vinculadas — [EY](https://www.ey.com/es_pe/insights/law/reglamento-financiamiento-participativo-financiero); [Revoredo](https://revoredo.pe/en/sobre-el-reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras/); [SmartLaw](https://smartlaw.com.pe/blog/2021/05/27/resumen-del-reglamento-de-financiamiento-participativo-financiero/)
- Hay que identificar a receptores e inversionistas. Las Sociedades Administradoras son sujetos obligados a reportar a la UIF-Perú — [CMS Grau](https://cms.law/es/per/publication/smv-emite-el-reglamento-de-la-actividad-de-financiamiento-participativo-financiero-y-sus-sociedades-administradoras)
- Obligación de actividad: después de los primeros 6 meses desde la inscripción, la plataforma debe publicar al menos un proyecto cada 12 meses. Por no hacerlo, la SMV revocó a Afluenta Perú con la Res. 039-2025-SMV/02 (abr-2025) — [Revista Gana Más](https://revistaganamas.com.pe/smv-revoca-autorizacion-de-afluenta-peru-por-falta-de-actividad-en-su-plataforma/); [La República](https://larepublica.pe/economia/2025/04/06/smv-retira-autorizacion-a-empresa-de-financiamiento-colectivo-por-inactividad-operativa-cual-es-afluenta-hnews-422526)

**Plataformas autorizadas y plazos**
- Primeras licenciadas, por el procedimiento especial transitorio: Afluenta e Inversiones.io. En el 2S-2023 fueron autorizadas Crowfi y Bloom (luego Inversiones Neurona). Prestópolis fue la quinta, en modalidad préstamos — [Gestión](https://gestion.pe/tu-dinero/smv-autoriza-funcionamiento-de-la-quinta-plataforma-de-crowdfunding-financiamiento-participativo-financiero-noticia/)
- Bajas: Afluenta revocada (abr-2025), Proyecto Crowd cancelada a pedido propio (2025), Inversiones Neurona cancelada (Res. 022-2026-SMV/02) — [Gestión – disminuyen plataformas](https://gestion.pe/economia/mercados/disminuyen-las-plataformas-de-inversion-via-crowdfunding-en-peru-por-que-noticia/); [Revista Gana Más](https://revistaganamas.com.pe/smv-cancela-autorizacion-de-inversiones-neurona-como-plataforma-de-financiamiento-participativo/)
- La Res. 076-2026-SMV/02 autorizó a Inversiones.io a operar también en la modalidad de valores, además de préstamos — [Revista Gana Más](https://revistaganamas.com.pe/smv-autoriza-a-inversiones-io-a-ampliar-su-plataforma-de-financiamiento-participativo-con-emision-de-valores/)
- La SMV autorizó 1 SAPFPF en el primer semestre de 2025 (no se identificó cuál) — [SMV – Informe de Evaluación Institucional 1S-2025](https://www.smv.gob.pe/ConsultasP8/documento.aspx?vidDoc=%7B50870799-0000-C315-AF3A-E05026B8F1A3%7D)
- **Plazo real (Prestópolis):** autorización de organización en jul-2023, solicitud de funcionamiento el 04-jul-2024 y autorización de funcionamiento por Res. 141-2024-SMV/02 (02-dic-2024, publicada el 04-dic-2024). En total unos 17 meses, unos 5 de ellos en la etapa de funcionamiento. Durante la evaluación la SMV pidió opinión previa a la SBS y hubo levantamiento de observaciones — [El Peruano NL 2350313-1](https://busquedas.elperuano.pe/dispositivo/NL/2350313-1); [Gestión](https://gestion.pe/tu-dinero/smv-autoriza-funcionamiento-de-la-quinta-plataforma-de-crowdfunding-financiamiento-participativo-financiero-noticia/)
- En 2022 la prensa ya señalaba que los topes de financiamiento limitaban el crecimiento del crowdfunding en Perú — [Gestión](https://gestion.pe/economia/empresas/topes-de-financiamiento-crowdfunding-limitarian-su-crecimiento-en-el-peru-noticia/)

### Inferences
- Fondealo encaja de lleno en el FPF modalidad préstamos (y en modalidad valores si emite instrumentos). La "Business Passport" sola, sin financiamiento, probablemente no es FPF. El módulo de "oportunidades" + inversionistas sí lo es. Lanzar el módulo de financiamiento en Perú sin autorización SMV sería una actividad no autorizada.
- El escrow Soroban en USDC no figura entre los mecanismos de canalización admitidos (escrow SBS, fideicomiso, dinero electrónico Ley 29985). Una plataforma autorizada tendría que pedir aprobación expresa a la SMV o usar el contrato solo como registro espejo, con los fondos pasando por un fiduciario o escrow bancario en soles o dólares fiat.
- Presupuesto mínimo de una SAPFPF propia: unos S/ 350 mil de capital pagado más el costo de cumplimiento (oficial LA/FT, gestión de riesgos, auditoría) y 12 a 18 meses de trámite. Una alternativa más rápida es asociarse con una plataforma ya autorizada (Inversiones.io, Prestópolis) y ofrecer la Passport como capa de KYB y scoring.
- Los inversionistas no institucionales con tope de 20% limitan la concentración. Fondealo debe implementar en su producto los controles de límite por inversionista, proyecto y receptor.

### Gaps
- No se pudo leer el texto consolidado del Reglamento 045-2021 con la Res. 019-2025-SMV/01. Faltan confirmar los límites finales (1,000/1,500 UIT), las obligaciones de información por proyecto, la moneda permitida y la definición de inversionista institucional.
- No se encontró la lista oficial 2026 de plataformas autorizadas, ni el estado de Crowfi, Finsmart o Prestamype, ni la SAPFPF autorizada en el 1S-2025.
- No se encontró el capital mínimo 2026, ni las tasas del TUPA SMV para el trámite.
- No se encontró ningún pronunciamiento SMV sobre el uso de criptoactivos o stablecoins en plataformas FPF.

---

## 2. Captación de fondos del público e intermediación (SBS, Ley 26702)

### Takeaway
El art. 11 de la Ley 26702 exige autorización previa de la SBS a quien capte o reciba dinero de terceros (depósito, mutuo u otra modalidad) y lo coloque en créditos. Hacerlo sin autorización es delito (art. 246 del Código Penal). Si Fondealo junta dinero de inversionistas en un pool propio y luego presta, queda en zona de intermediación no autorizada. La salida legal para conectar inversionistas con prestatarios es la figura FPF, que la SMV supervisa con opinión de la SBS.

### Cited Findings
- El art. 11 de la Ley 26702 exige autorización previa de la SBS a toda persona natural o jurídica que pretenda captar o recibir dinero de terceros en depósito, mutuo u otra modalidad. También alcanza a quien coloca esos fondos en créditos, inversión o habilitación de fondos. Las infracciones se sancionan según el Código Penal — [SBS – alerta captación](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/2565); [IUS Latin](https://iuslatin.pe/sbs-advierte-sobre-nuevos-esquemas-de-captacion-de-dinero-sin-autorizacion/); [El Comercio](https://elcomercio.pe/economia/peru/sbs-advierte-sobre-entidades-que-captan-dinero-del-publico-sin-autorizacion-y-aplicativos-informales-que-ofrecen-prestamos-de-dinero-l-ultimas-noticia/)
- La SBS sostiene que la captación por entidades no autorizadas es delito del art. 246 del Código Penal, y que esos fondos no están cubiertos por el Fondo de Seguro de Depósitos — [SBS](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/2565); [Gestión](https://gestion.pe/tu-dinero/sbs-advierte-sobre-captacion-de-dinero-por-entidades-no-autorizadas-noticia/)
- La SBS también alerta sobre apps de préstamo informales que piden acceso a contactos y fotos y que usan términos como "financiera" o "Coopac" para parecer supervisadas — [El Comercio](https://elcomercio.pe/economia/peru/sbs-advierte-sobre-entidades-que-captan-dinero-del-publico-sin-autorizacion-y-aplicativos-informales-que-ofrecen-prestamos-de-dinero-l-ultimas-noticia/)
- Precedente: la SBS clausuró los locales de "Emprende Margarite" (Margarite S.A.C.), que ofrecía mutuos con 10% a 12% mensual, y presentó denuncia penal por captación y por desobediencia (Res. SBS 03422-2023 citada) — [Gestión](https://gestion.pe/tu-dinero/finanzas-personales/sbs-clausura-en-lima-a-entidad-que-captaba-dinero-del-publico-sin-autorizacion-noticia/); [Andina](https://andina.pe/ingles/noticia-sbs-clausura-lima-a-entidad-captaba-dinero-del-publico-sin-autorizacion-965453.aspx)
- La Ley 30050 (art. 2) reserva la publicidad de activos financieros en medios masivos a entidades autorizadas o supervisadas por la SMV o la SBS — [El Comercio – SMV advertencia](https://elcomercio.pe/economia/mercados/smv-advierte-adquisicion-promocion-criptomonedas-peru-noticia-581451-noticia/)

### Inferences
- Diseño a evitar: una wallet o contrato operado por Fondealo que reciba USDC de muchos inversionistas en un fondo común y decida a qué empresas prestar. Eso parece captación + colocación. El diseño defendible es el *matching* 1:1 por proyecto concreto, con el inversionista eligiendo, el fondeo directo al receptor y la plataforma sin disponer de los fondos, dentro de una SAPFPF autorizada.
- El marketing público de "invierte y gana X%" está restringido (Ley 30050) mientras Fondealo no esté autorizado.

### Gaps
- No se encontró jurisprudencia ni opinión SBS sobre si un escrow no custodial en smart contract es "recibir dinero de terceros".
- No se verificó el texto literal vigente del art. 11 de la Ley 26702 ni del art. 246 del Código Penal (penas).

---

## 3. Derecho de valores: participaciones o tokens como "valor mobiliario"

### Takeaway
No hay régimen de tokenización en Perú. La SMV advirtió en 2021 y de nuevo en 2025 que no existe regulación que ampare la oferta de criptomonedas o tokens. Si un token de Fondealo representa derechos de cobro sobre préstamos o receivables y se ofrece al público, es probable que califique como valor mobiliario y exija inscripción en el RPMV, o encajar en la modalidad "valores" del FPF (como hizo Inversiones.io en 2026).

### Cited Findings
- Comunicado SMV del 06-mar-2021: no existe regulación específica en Perú que ampare la oferta o promoción de criptomonedas, monedas virtuales o tokens. Las empresas que los promueven no están supervisadas. Recuerda el art. 2 de la Ley 30050 sobre publicidad — [SMV – Advertencia tokens](https://www.gob.pe/institucion/smv/noticias/1121398-advertencia-sobre-la-adquisicion-de-monedas-virtuales-o-criptomonedas-y-la-participacion-en-esquemas-de-financiamiento-por-el-uso-de-tokens); [El Comercio](https://elcomercio.pe/economia/mercados/smv-advierte-adquisicion-promocion-criptomonedas-peru-noticia-581451-noticia/); [CriptoNoticias](https://www.criptonoticias.com/regulacion/regulador-peruano-ico-criptoactivos-smv/)
- El Peruano publicó el 06-mar-2025 una nueva advertencia SMV sobre esquemas de criptomonedas y tokens promocionados en medios masivos. No queda claro si es un comunicado nuevo — [El Peruano](https://www.elperuano.pe/noticia/265609-criptomonedas-en-peru-smv-alerta-sobre-fraudes-y-estafas-en-ofertas-sin-regulacion); [Thelem Abogados](https://thelemabogados.pe/es/la-smv-se-pronuncia-nuevamente-sobre-las-operaciones-de-adquisicion-de-monedas-virtuales-y-la-recaudacion-de-fondos-para-financiar-actividades-a-traves-de-tokens/)
- Opinión doctrinal: que exista un token no permite concluir por sí solo si es o no valor mobiliario. Si califica y se ofrece al público, aplica la Ley del Mercado de Valores, incluida la inscripción en el RPMV — [Rosegile Law](https://paragraph.com/@publication-1787844006044/como-tokenizar-sin-una-ley-cripto-la-ruta-cross-border-desde-el-peru)
- No hay sandbox ni régimen piloto de tokenización — [Metlabs](https://metlabs.io/regulacion-blockchain/peru/)
- Inversiones.io obtuvo en 2026 autorización para la modalidad de valores del FPF (Res. 076-2026-SMV/02) — [Revista Gana Más](https://revistaganamas.com.pe/smv-autoriza-a-inversiones-io-a-ampliar-su-plataforma-de-financiamiento-participativo-con-emision-de-valores/)
- La SMV publicó cambios para dinamizar el Mercado Alternativo de Valores (Res. 013-2025-SMV/01), una posible vía de emisión para pymes — [LexLatin](https://lexlatin.com/reportajes/resolucion-smv-013-2025-mercado-alternativo-valores-peru)

### Inferences
- La Passport es un registro no transferible y sin derechos económicos, así que muy probablemente no es valor. El riesgo está en cualquier token transferible de participación en préstamos: no emitirlo en Perú sin estructura SMV.
- Que el contrato registre posiciones de inversionistas (no transferibles) es menos riesgoso que tokens negociables, pero puede seguir siendo FPF.

### Gaps
- No se citó la definición de valor mobiliario (art. 3 del TUO de la LMV, D.S. 093-2002-EF) ni las exenciones de oferta privada [Conocimiento previo, sin fuente].
- No se encontró ninguna resolución SMV que califique un token concreto.

---

## 4. Criptoactivos / PSAV, stablecoins (USDC), BCRP y cambio de moneda

### Takeaway
Perú no tiene licencia cripto. El régimen es solo antilavado: el D.S. 006-2023-JUS hizo a los PSAV sujetos obligados ante la UIF-Perú y la Res. SBS 02648-2024 fijó su sistema de prevención (SPLAFT). Si Fondealo custodia o transfiere USDC por cuenta de terceros, será PSAV, con oficial de cumplimiento, debida diligencia, reportes y Travel Rule (desde el 01-ago-2026). El BCRP estudia las stablecoins pero no las regula. La ley cripto (PL 1042/2021-CR) sigue sin aprobarse.

### Cited Findings
- El D.S. 006-2023-JUS incorpora a los PSAV como sujetos obligados de prevención LA/FT — [Abogado Blockchain](https://abogadoblockchain.com/regulacion-cripto-peru/); [Infobae](https://www.infobae.com/peru/2024/08/03/sbs-inicia-regulacion-a-empresas-de-criptomonedas-en-el-peru-para-prevenir-el-lavado-de-activos/)
- La Res. SBS N° 02648-2024 aprueba la "Norma para la prevención del LA/FT aplicable a los PSAV bajo supervisión de la UIF-Perú" y modifica el TUPA SBS. Hay discrepancia sobre la fecha de publicación (30-jul-2024 según Notabene, 01-ago-2024 según otras fuentes) — [Texto SBS (PDF)](https://intranet2.sbs.gob.pe/dv_int_cn/2424/v1.0/Adjuntos/2648-2024.R.pdf); [vLex](https://vlex.com.pe/vid/resolucion-sbs-n-02648-1044929305); [El Peruano](https://elperuano.pe/noticia/249277-sbs-adopta-lineamientos-para-mitigar-riesgos-aplicables-a-los-proveedores-de-servicios-de-activos-virtuales); [Cuatrecasas](https://cuatrecasas.com/resources/aprueban-norma-splaft-para-proveedores-de-servicios-de-activos-virtuales-psav-66b130a63d0be744017758.pdf); [Notabene](https://notabene.id/world/peru)
- Ámbito: personas naturales con negocio o personas jurídicas domiciliadas o constituidas en el país (incluidas sucursales de extranjeras) que hacen, por cuenta de terceros, actividades como intercambio, transferencia o custodia de activos virtuales — [vLex](https://vlex.com.pe/vid/resolucion-sbs-n-02648-1044929305); [Infolaft](https://www.infolaft.com/peru-proveedores-de-criptoactivos-tendran-que-prevenir-lavado-de-activos)
- Obligaciones: implementar el SPLAFT con 120 días para adecuarse; designar un oficial de cumplimiento a dedicación exclusiva con alterno y comunicarlo a la UIF en 15 días hábiles vía SISDEL; reportar operaciones sospechosas en máximo 24 horas; conservar registros 5 o más años; presentar el informe anual del oficial antes del 15 de febrero — [Verifica.id](https://verifica.id/debida-diligencia-psav-peru-sbs/); [Abogado Blockchain](https://abogadoblockchain.com/cumplimiento-uif-cripto-peru/) **[Verificar: fuentes de proveedores]**
- La Travel Rule rige desde el 01-ago-2026 — [Notabene](https://notabene.id/world/peru)
- No hay licencia ni registro prudencial previo. La Evaluación Nacional de Riesgos 2025 reconoce que Perú no tiene regulación prudencial que obligue a los PSAV a inscribirse antes de operar — [Carlos Maiz](https://www.carlosmaiz.com/criptomonedas-en-peru/); [Metlabs](https://metlabs.io/regulacion-blockchain/peru/). En 2026 una resolución SBS modificó artículos de la norma PSAV (arts. 7.5, 9, 10.3 y 11) — [Educación en Red – Res. SBS 01015-2026](https://actualidad.educacionenred.pe/2026/04/res-sbs-01015-2026-aprueban-norma-para-prevencion-lavado-activos-financiamiento-340665.html) **[Verificar]**
- Ley cripto: el PL 1042/2021-CR "Ley Marco de Comercialización de Criptoactivos" seguía sin aprobarse en el Pleno a mayo-2026. Volvió a comisión en marzo-2025. El MEF, la SBS y el BCRP no lo respaldan — [Abogado Blockchain](https://abogadoblockchain.com/regulacion-cripto-peru/); [Gestión](https://gestion.pe/tu-dinero/mercado-de-criptomonedas-peruano-en-riesgo-por-inminente-ley-del-congreso-criptomonedas-en-peru-asociacion-de-fintech-noticia/); [CriptoNoticias](https://www.criptonoticias.com/regulacion/peru-regular-ia-congela-leyes-bitcoin/)
- BCRP: la Revista Moneda N° 203 (sept-2025) describe las stablecoins como criptoactivos 1:1. Atribuye su crecimiento en Perú a operaciones transfronterizas más baratas y menciona que Lemon, Prexpe y Tulkit las ofrecen. No hay norma BCRP sobre stablecoins — [BCRP Moneda 203 (PDF)](https://www.bcrp.gob.pe/docs/Publicaciones/Revista-Moneda/moneda-203/moneda-203-03.pdf); [CryptoNews](https://cryptonews.net/es/news/finance/32702036/)
- Mercado: el BCP lanzó CriptoCocos, un piloto con BTC y USDC custodiados por BitGo, con tope de US$ 999 por operación, US$ 3,000 por cliente y comisión de 1% — [Forbes Perú](https://forbes.pe/activos-digitales/2026-01-05/mercado-cripto-en-peru-crece-ante-auge-de-las-stablecoins-las-criptoapps-aumentan-sus-usuarios-y-la-banca-estudia-su-incursion/); [Rio Times](https://www.riotimesonline.com/peru-banks-stablecoin-fx-2026)
- Precedentes de fraude: la SBS alertó en abr-2021 sobre esquemas cripto no autorizados (AirBit Club, Omega Pro, Olymp Trade) — [CriptoNoticias](https://www.criptonoticias.com/regulacion/peru-advierte-im-mastery-academy-airbit-club); [La República](https://larepublica.pe/economia/2020/12/14/sbs-identifica-10-nuevas-plataformas-de-estafa-financiera)

### Inferences
- Pagar y cobrar en USDC no está prohibido, pero tampoco tiene amparo regulatorio. Si Fondealo custodia o mueve USDC de terceros, aunque sea por un escrow que controla con claves de administración, será PSAV con obligaciones UIF y Travel Rule.
- Los prestatarios pyme peruanos necesitan soles. La conversión USDC↔PEN requiere un exchange PSAV registrado y genera riesgo cambiario que hay que revelar. Lo más prudente es denominar las oportunidades en PEN o USD fiat y usar USDC solo como riel opcional para inversionistas extranjeros.
- Con la instalación del nuevo Congreso bicameral en julio-2026, los proyectos del periodo 2021-2026 no aprobados probablemente se archivan [Verificar en el Reglamento del Congreso].

### Gaps
- No se encontró una postura formal del BCRP sobre usar USDC para desembolsos o pagos. Tampoco se citó la libertad cambiaria (art. 64 de la Constitución) [Conocimiento previo, sin fuente].
- No se verificó si un escrow Soroban no custodial califica como "custodia" o "transferencia por cuenta de terceros" en la Res. 02648-2024.

---

## 5. Prevención de lavado de activos y KYB (UIF-Perú, beneficiario final)

### Takeaway
Fondealo sería sujeto obligado ante la UIF por dos vías: como Sociedad Administradora FPF (Ley 29038, art. 3, num. 28) y como PSAV si maneja USDC. Eso implica oficial de cumplimiento, manual, ROS y debida diligencia de receptores e inversionistas. Para el KYB, el régimen de beneficiario final (D.Leg. 1372) usa el umbral de 10% de propiedad.

### Cited Findings
- La Ley 29038 (versión SBS) incluye en su lista de sujetos obligados a "28. Las Sociedades Administradoras, conforme al Decreto de Urgencia que regula el FPF" — [Ley 29038 (SBS, PDF)](https://www.sbs.gob.pe/Portals/5/Ley%2029038%20Ley%20que%20incorpora%20la%20UIF-Peru%20a%20la%20SBS.pdf); [SBS – Relación de Sujetos Obligados](https://www.sbs.gob.pe/prevencion-de-lavado-activos/Sujetos-Obligados/Relacion-de-Sujetos-Obligados)
- El D.S. 008-2025-JUS (13-may-2025) amplió la lista de sujetos obligados, por ejemplo a gestoras de fondos de oferta privada no supervisadas por la SMV — [Cuatrecasas – Perú 2025](https://www.cuatrecasas.com/es/latam/art/peru-que-ha-pasado-2025)
- Beneficiario final: rige por el D.Leg. 1372 y el D.S. 003-2019-EF. Criterio de propiedad: persona natural con 10% o más del capital, directa o indirectamente; si no hay, se aplican el criterio de control y luego el de cargo administrativo superior. La RS 168-2025/SUNAT (28-may-2025) fija el cronograma para empresas con ingresos menores a 300 UIT. El despliegue es progresivo hasta nov-2026 (más de 587 mil personas jurídicas). Se presenta con el Formulario Virtual 3800. Multa: 0.6% de ingresos netos, con mínimo 5 UIT y máximo 50 UIT — [SUNAT RS 168-2025 (PDF)](https://www.sunat.gob.pe/legislacion/superin/2025/000168-2025.pdf); [El Peruano](https://www.elperuano.pe/noticia/283047-sunat-cerca-de-83-mil-contribuyentes-deberan-presentar-la-declaracion-del-beneficiario-final); [La Cámara](https://lacamara.pe/declaracion-del-beneficiario-final-cuales-son-los-nuevos-plazos/?print=pdf)

### Inferences
- El flujo KYB de Fondealo (RUC, representante legal, accionistas) debe llegar hasta la persona natural con 10% o más y aplicar listas de sanciones y PEP. Puede pedir a la empresa la constancia de su declaración de beneficiario final. Las empresas que se registren ya deberían haberla presentado según su cronograma.
- Si se asocia con una SAPFPF autorizada, la obligación UIF recae en el socio, pero Fondealo tendrá que cumplir el estándar del socio por contrato.

### Gaps
- No se encontró la norma SMV específica de LA/FT para SAPFPF, ni el detalle de reportes (registro de operaciones, umbrales).
- No se confirmó si SUNAT abre el registro de beneficiario final a sujetos obligados privados.

---

## 6. Datos personales (Ley 29733, D.S. 016-2024-JUS) y centrales de riesgo (Ley 27489, CEPIRS)

### Takeaway
El nuevo reglamento de datos personales (D.S. 016-2024-JUS) rige desde fines de marzo de 2025. Exige consentimiento, Oficial de Datos Personales, aviso de brechas en 48 horas y reglas de flujo transfronterizo. Una "reputación crediticia" que Fondealo compila y comparte con inversionistas o terceros se parece mucho a la actividad de una CEPIRS (Ley 27489). Además, escribir datos de personas naturales (representantes, accionistas) en un ledger inmutable choca con los derechos de cancelación.

### Cited Findings
- El D.S. 016-2024-JUS (El Peruano, 30-nov-2024) aprueba el nuevo Reglamento de la Ley 29733 y deroga el D.S. 003-2013-JUS. Tiene 135 artículos — [D.S. 016-2024-JUS (SMV PDF)](https://www.smv.gob.pe/Uploads/DS016_2024_JUS.pdf); [LP Derecho (PDF)](https://img.lpderecho.pe/wp-content/uploads/2024/11/Decreto-Supremo-016-2024-JUS-LPDerecho.pdf)
- Entró en vigencia el 30 o 31 de marzo de 2025 (las fuentes difieren) — [Estudio Carrión](https://estudiocarrion.com/nuevo-reglamento-proteccion-de-datos-personales-entra-en-vigor-en-marzo-2025/); [Kom.pe](https://kom.pe/reglamento-ds-016-2024-jus-datos-personales/)
- La obligación de designar un Oficial de Datos Personales empezó el 30-nov-2025 para los primeros obligados (régimen escalonado). Las brechas se notifican en 48 horas — [Kom.pe](https://kom.pe/reglamento-ds-016-2024-jus-datos-personales/); [Altimea](https://www.altimea.com/blog/nuevo-reglamento-proteccion-datos-peru-ds-016-2024-jus/) **[Verificar]**
- Flujo transfronterizo: debe hacerse hacia países con nivel adecuado de protección, o con garantías. Se puede pedir opinión a la Dirección General de Transparencia, Acceso a la Información Pública y Protección de Datos Personales, y el flujo debe ponerse en su conocimiento — [D.S. 016-2024-JUS](https://www.smv.gob.pe/Uploads/DS016_2024_JUS.pdf); [Ley 29733 vigente 2025](https://www.smv.gob.pe/Uploads/Ley_29733_vigente_2025.pdf)
- La Ley 27489 regula las CEPIRS y protege al titular de la información. Aplica a todas las CEPIRS que operen en el territorio nacional. Exige infraestructura informática adecuada, procedimientos de atención de consultas y reclamos, y controles de validez de la información. Pueden adoptar cualquier forma societaria — [vLex Ley 27489](https://vlex.com.pe/vid/ley-n-27489-regula-800702069); [TC Exp. 03700-2010-HD](https://www.tc.gob.pe/jurisprudencia/2015/03700-2010-HD.html)
- Las CEPIRS reciben datos consolidados de la Central de Riesgos SBS y pueden recabar información de riesgos de cualquier fuente — [SBS – Boletín Centrales de Riesgos](https://www.sbs.gob.pe/boletin/detalleboletin/idbulletin/2323)
- Hay contradicción sobre la autorización: un documento de proyecto de ley afirma que la Ley 27489 trae requisitos de autorización y supervisión por la SBS ([PL 08239-2023-CR (CMS)](https://cms.law/content/download/690614/file/Proyecto%20de%20Ley%20N%C2%B0%2008239-2023-CR.pdf)), pero ninguna otra fuente encontrada describe un trámite de autorización SBS. Sobre proyectos que coordinarían protocolos con la SBS y la ANPD: [Opinión PL 7919 (gob.pe)](https://cdn.www.gob.pe/uploads/document/file/9282108/7614575-sobre-proyecto-de-ley-que-protege-a-los-consumidores-de-servicios-financieros-del-manejo-indebido-de-su-informacion-personal-que-disponen-las-centrales-privadas-de-riesgo-y-las-billeteras-digitales.pdf)
- Reforma pendiente: el Pleno aprobó prohibir que los reportes CEPIRS contengan "juicios de valor u opiniones subjetivas" y limitar su uso en contratación laboral. No se confirmó su promulgación — [Congreso – Pleno CEPIRS](https://comunicaciones.congreso.gob.pe/?p=274285); [Congreso](https://comunicaciones.congreso.gob.pe/noticias/definen-restricciones-para-centrales-privadas-de-informacion-de-riesgos)

### Inferences
- Si la Passport se ofrece a terceros (inversionistas, otros financiadores) como reporte de riesgo de empresas, Fondealo podría calificar como CEPIRS y le aplicarían las reglas de la Ley 27489: calidad del dato, derecho de rectificación y límites de antigüedad. Mitigaciones posibles: que solo la empresa titular comparta su Passport (modelo "portabilidad por consentimiento del titular"), o encuadrarse como CEPIRS desde el inicio.
- On-chain: guardar solo hashes o atestaciones sin datos personales, y mantener los datos de representantes y accionistas off-chain y borrables. Si el reporte contiene "opiniones subjetivas", podría chocar con la reforma pendiente.
- La Central de Riesgos SBS solo llega a través de CEPIRS (Sentinel, Equifax, Experian) o con un reporte que entrega el propio titular. Fondealo no tendría acceso directo. Si se usan servidores fuera de Perú (nube), hay flujo transfronterizo que se debe documentar.

### Gaps
- No se verificó el trámite actual de inscripción de bancos de datos en el Registro Nacional de Protección de Datos ni las multas vigentes.
- No se confirmó qué autoridad supervisa hoy a las CEPIRS (ANPD, SBS o INDECOPI), ni si existe un registro o autorización obligatoria.

---

## 7. Tasas máximas de interés y protección al consumidor

### Takeaway
El BCRP fija semestralmente topes de tasa de interés convencional compensatorio: 114.13% anual en soles y 99.84% en dólares para mayo–oct 2026, y según la prensa 114.68% y 103.14% desde nov-2026. Las fuentes se contradicen sobre si aplican a prestamistas fuera del sistema financiero. Los topes no afectan la viabilidad de un crédito pyme normal, pero Fondealo debe controlarlos en su producto. Si algún prestatario es persona natural o microempresario en situación de asimetría, aplica INDECOPI (Ley 29571).

### Cited Findings
- Circular N° 0008-2021-BCRP sobre tasas de interés, dictada en el marco de la Ley 31143 — [vLex](https://vlex.com.pe/vid/866117217); [IUS Latin](https://iuslatin.pe/bcrp-aprueban-circular-sobre-tasas-de-interes/)
- Del 01-may-2026 al 31-oct-2026 los topes son 114.13% anual en soles y 99.84% en dólares — [BCRP Nota Informativa 2026-04-07 (PDF)](https://www.bcrp.gob.pe/docs/Transparencia/Notas-Informativas/2026/nota-informativa-2026-04-07.pdf); [Camex](https://camex.ai/tasas-maximas-convencionales-en-peru-114-13-anual-en-soles-y-99-84-en-dolares-vi/)
- Del 01-nov-2026 al 30-abr-2027 serían 114.68% en soles y 103.14% en dólares — [Infobae 14-oct-2026](https://www.infobae.com/peru/2026/10/14/creditos-en-dolares-podran-costar-mas-del-doble-desde-noviembre/) **[Verificar en BCRP]**
- La SBS vigila los topes en las empresas del sistema financiero para crédito de consumo, consumo de bajo monto y pequeña y microempresa (Res. SBS 02192-2022) — [Actualidad Empresarial](https://actualidadempresarial.pe/normas-legales/resolucion-sbs-02192-2022/6a768ce1-8150-4f72-b773-ab194497a5e1)
- Contradicción: una fuente dice que quien presta fuera del sistema financiero no está sujeto al tope ([Modelo.pe](https://modelo.pe/blog/tasa-de-interes-maxima-legal-prestamo-peru-2026/)) y otra que los topes BCRP aplican también a préstamos entre particulares ([Perú Gestiona](https://perugestiona.pe/deudas-finanzas/tasa-interes-peru/)). Ninguna es primaria.
- El INDECOPI es la Autoridad Nacional de Protección al Consumidor. El Código (Ley 29571) prohíbe métodos de cobranza intimidatorios (arts. 61-62) — [Congreso – leyes CODECO](https://www.congreso.gob.pe/Docs/comisiones2022/Consumidor/files/notas_de_prensa/nueve_leyes_codeco.pdf); [Revista Continental](https://journals.continental.edu.pe/index.php/derechopublicoeconomico/article/download/746/698)

### Inferences
- Lo prudente es aplicar el tope BCRP a todo préstamo del FPF, revelar la TCEA y aplicar cobranza no intimidatoria. Hay que excluir de inicio a personas naturales o "proyectos personales" para evitar el régimen de consumidor.

### Gaps
- No se confirmó con fuente primaria si la Circular 0008-2021-BCRP fija topes para operaciones entre personas ajenas al sistema financiero (Código Civil, art. 1243).
- No se verificó el criterio de INDECOPI que considera consumidor al microempresario con asimetría informativa [Conocimiento previo, sin fuente].

---

## 8. Factoring y factura negociable (Ley 29623) como riel alternativo; datos de SUNAT

### Takeaway
La factura negociable es una vía de financiamiento pyme madura: Ley 29623, D.S. 208-2015-EF y registro de empresas de factoring en la SBS por la Res. SBS 4358-2015. Fondealo podría usarla como activo subyacente, sea por una plataforma FPF o asociándose con un factor registrado. La verificación de datos tributarios por API depende de que el contribuyente dé su consentimiento.

### Cited Findings
- La Ley 29623 promueve el financiamiento a través de la factura comercial. Su reglamento es el D.S. 208-2015-EF. Para que la factura negociable circule se necesita la Constancia de Presentación y que el adquirente no haya registrado su disconformidad dentro del plazo del art. 7 de la Ley — [vLex Ley 29623](https://vlex.com.pe/vid/ley-n-29623-promueve-941178293); [vLex D.S. 208-2015-EF](https://vlex.com.pe/vid/decreto-supremo-n-208-941613658); [Modificación del Reglamento (gob.pe)](https://cdn.www.gob.pe/uploads/document/file/253336/228089_file20181218-16260-az75wz.pdf)
- Res. SBS 4358-2015 (Reglamento de Factoring): define a las empresas de factoring (adquieren facturas comerciales, negociables y títulos de deuda) y regula el registro de las no comprendidas en la Ley General. La SMV fija la anotación en cuenta y la participación en el ICLV (CAVALI) — [SBS – Reglamento de Factoring (PDF)](https://www.sbs.gob.pe/Portals/0/jer/Auto_Nuevas_Empresas/Sistema_Financiero/13.%20Reg.%20de%20Factoring_Res.%20SBS%20N%C2%B0%204358-2015.pdf); [CreceMype](https://www.crecemype.pe/portal/factoring/la_ley_29623_y_su_reglamento.html)

### Inferences
- Financiar facturas negociables registradas en CAVALI da un subyacente verificable (comprador conforme) y un historial de pago objetivo para el score de la Passport.
- Para datos SUNAT: la consulta RUC es pública. Para datos tributarios más profundos (ventas, comprobantes electrónicos) hace falta el consentimiento del contribuyente o su clave SOL, o un proveedor de datos autorizado. La reserva tributaria impide que SUNAT los entregue a terceros sin autorización [Conocimiento previo, sin fuente].

### Gaps
- No se verificaron los requisitos y costos de inscripción en el registro SBS de empresas de factoring, ni si las facturas negociables pueden financiarse dentro del FPF.
- No se encontró información sobre APIs oficiales de SUNAT para terceros con consentimiento.

---

## 9. Tributación

### Takeaway
No hay un régimen tributario específico para criptoactivos. SUNAT anunció que trabaja en uno y la prensa estima su aplicación recién en 2027. Los intereses que una empresa peruana paga a inversionistas no domiciliados tienen retención de 30% como regla general, o 4.99% para créditos externos que cumplan requisitos. El tratamiento del IGV sobre intereses y comisiones no quedó verificado.

### Cited Findings
- En feb-2025 SUNAT anunció que evaluaba gravar las ganancias cripto como renta de segunda categoría (personas naturales) o tercera (empresas). En may-2026 su jefe, Javier Franco, dijo que preparan una propuesta normativa. El marco de información estaría listo en el 2S-2026 y el impuesto se aplicaría desde 2027 — [La República](https://larepublica.pe/zona-crypto/2025/02/20/sunat-evalua-impuesto-a-las-ganancias-por-criptomonedas-hnews-1402840); [Infomercado](https://infomercado.pe/sunat-prepara-norma-para-controlar-las-operaciones-con-bitcoin-y-criptomonedas/); [Gestión](https://gestion.pe/economia/sunat-pone-en-la-mira-a-criptomonedas-avanzan-impuestos-a-las-ganancias-por-bitcoin-y-otras-noticia/)
- Intereses a no domiciliados: la retención general es 30%. La tasa de 4.99% aplica a intereses de créditos externos que no superen la tasa preferencial predominante más 3 puntos (referencia SOFR+7 desde el D.S. 137-2023-EF), con ingreso acreditado de la moneda al país y sin vinculación. Se declara con el PDT 617 — [Garrigues](https://www.garrigues.com/es_ES/noticia/peru-impuesto-renta-queda-sin-efecto-utilizacion-tasa-libor-operaciones-prestamo-no); [B&B Abogados](https://bybconsultores.pe/impuesto-a-la-renta/prestamos-no-domiciliados-devengo-intereses-deduccion/); [ContaPerú](https://www.contaperuglobal.com/post/retenci%C3%B3n-a-intereses-prestamos-de-no-domiciliados-ley-del-impuesto-a-la-renta); [SUNAT – LIR Cap. VII](https://www.sunat.gob.pe/legislacion/renta/ley/capvii.pdf)

### Inferences
- Cuando la pyme peruana paga intereses a un inversionista extranjero, la pyme es agente de retención. Esto complica los repagos automáticos en USDC desde un smart contract, porque hay que calcular y pagar la retención en soles a SUNAT. El producto debe hacer las retenciones por inversionista según su domicilio.
- Las comisiones de Fondealo como empresa domiciliada probablemente están gravadas con IGV (18%) [Conocimiento previo, sin fuente].

### Gaps
- IGV sobre intereses de mutuos entre no financieros y sobre comisiones de plataforma: sin fuente.
- Retención a inversionistas domiciliados personas naturales (5% por renta de capital) y tratamiento de pérdidas por incobrables: sin fuente.

---

## 10. Sandbox regulatorio y proyectos de ley 2025-2026

### Takeaway
Desde el 25-nov-2025 el sandbox de la SBS (Res. SBS 2429-2021, modificada por la Res. SBS 04142-2025) admite empresas no supervisadas como fintechs, con pilotos de hasta unos 30 meses y garantía líquida para fondos de terceros. Es la vía más concreta para un piloto. No se encontró sandbox de la SMV para FPF ni para tokenización.

### Cited Findings
- La Res. SBS 2429-2021 (publicada el 20-ago-2021) creó el "Reglamento para la realización temporal de actividades en modelos novedosos", basado en el D.U. 013-2020. Tiene un régimen de flexibilización (45 días hábiles) y uno extraordinario (60 días hábiles) y admite solicitudes grupales. Antes solo alcanzaba a empresas supervisadas — [Res. SBS 2429-2021 (PDF)](https://intranet2.sbs.gob.pe/dv_int_cn/2112/v1.0/Adjuntos/2429-2021.doc.pdf); [El Peruano NL 1983647-1](https://busquedas.elperuano.pe/dispositivo/NL/1983647-1); [EY](https://www.ey.com/es_pe/insights/financial-accounting-advisory-services/innovacion-regulacion-financiera-sandbox-regulatorio-sbs)
- La Res. SBS 04142-2025 (publicada el 24-nov-2025, vigente desde el 25-nov-2025) suma a empresas no supervisadas (fintechs, startups), COOPAC y AFOCAT. Exige idoneidad moral, capacidad operativa, recursos y mecanismos de garantía líquida. Actualiza el procedimiento TUPA N° 202. Los pilotos pueden durar hasta 30 meses — [SBS – nota](https://www.sbs.gob.pe/noticia/detallenoticia/idnoticia/3866); [Revoredo](https://revoredo.pe/en/el-nuevo-sandbox-regulatorio-de-la-sbs-un-cambio-de-paradigma-para-la-innovacion-financiera-en-el-peru/); [Infobae](https://www.infobae.com/peru/2025/11/24/sandbox-regulatorio-sbs-permitira-que-fintechs-y-cooperativas-experimenten-con-nuevos-productos-financieros-durante-30-meses/); [Gestión](https://gestion.pe/tu-dinero/sandbox-regulatorio-sbs-modifica-reglamento-cual-es-el-objetivo-y-quiénes-podrán-entrar-noticia/); [Texto (BTO Integrity PDF)](https://www.btointegrity.com/wp-content/uploads/2025/11/SBS_Reglamento_Sandbox_Modificado__1763995200.pdf)
- Contradicción: Metlabs afirma que no hay sandboxes implementados ([Metlabs](https://metlabs.io/regulacion-blockchain/peru/)). Lo desmienten las normas SBS de arriba, aunque quizá Metlabs se refiera solo a cripto o tokenización.
- Proyectos de ley: PL 1042/2021-CR (cripto), pendiente (ver sección 4). PL 13385/2025-CR modifica la prescripción en el Código del Consumidor, con opinión de INDECOPI en feb-2026 — [Congreso – CODECO](https://www.congreso.gob.pe/Docs/comisiones2022/Consumidor/files/notas_de_prensa/doce_leyes_codeco-2022-2023.pdf). El proyecto de reforma CEPIRS está aprobado en el Pleno, con promulgación sin confirmar (ver sección 6).

### Inferences
- El sandbox SBS cubre actividades del ámbito SBS (por ejemplo, captación o crédito con fondos de terceros), no el FPF, que es de la SMV. Podría servir para probar un modelo de crédito pyme con fondeo en stablecoin solo si se plantea como actividad bajo el ámbito SBS. Hay que confirmarlo con la SBS.

### Gaps
- No se encontró sandbox ni innovation hub de la SMV, ni participantes admitidos en el sandbox SBS desde nov-2025.
- No se encontró ninguna ley fintech general ni de tokenización en trámite en el nuevo Congreso 2026-2031.

---

## 11. Precedentes de enforcement

### Takeaway
En FPF las medidas de la SMV han sido administrativas: revocación por inactividad (Afluenta), suspensión por patrimonio insuficiente seguida de cancelación (Neurona) y cancelaciones voluntarias (Proyecto Crowd). En captación, la SBS clausura locales y presenta denuncias penales. No se encontró ninguna sanción publicada contra una plataforma cripto específica.

### Cited Findings
- Afluenta: revocada por la Res. 039-2025-SMV/02 por no financiar proyectos en 12 meses — [La República](https://larepublica.pe/economia/2025/04/06/smv-retira-autorizacion-a-empresa-de-financiamiento-colectivo-por-inactividad-operativa-cual-es-afluenta-hnews-422526)
- Inversiones Neurona: suspendida en 2025 por patrimonio insuficiente y cancelada por la Res. 022-2026-SMV/02 — [Gestión](https://gestion.pe/economia/empresas/smv-cancela-autorizacion-de-la-plataforma-de-crowdfunding-inversiones-neurona-noticia/)
- El Reglamento de Sanciones SMV (Res. SMV 035-2018-SMV/01) tipifica como infracción hacer actividades no autorizadas cuando se exige autorización — [Reglamento de Sanciones (BVL PDF)](https://s3.us-east-1.amazonaws.com/site.documents.cdn.prod.bvl.com.pe/Reglamento_de_Sanciones_(05.07.2022).pdf); [El Peruano – modificación](https://busquedas.elperuano.pe/dispositivo/NL/2079705-1)
- SBS: clausura y denuncia penal contra "Emprende Margarite". Alertas sobre AirBit Club, Omega Pro y Olymp Trade — [Andina](https://andina.pe/ingles/noticia-sbs-clausura-lima-a-entidad-captaba-dinero-del-publico-sin-autorizacion-965453.aspx); [CriptoNoticias](https://www.criptonoticias.com/regulacion/peru-advierte-im-mastery-academy-airbit-club)

### Inferences
- El riesgo regulatorio más probable para Fondealo es empezar a "captar" inversionistas antes de tener autorización. También, una vez autorizado, no tener actividad o patrimonio suficientes.

### Gaps
- No se encontraron montos de multas SMV por FPF no autorizado ni casos sancionados contra exchanges o PSAV en la UIF.
