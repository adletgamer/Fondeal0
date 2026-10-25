# Política KYB v1 (BORRADOR)

**Versión:** `kyb-v1-draft` · **Estado:** borrador, pendiente de aprobación del dueño del producto · **Entorno de aplicación:** Testnet. Nada de esto autoriza a manejar documentos reales ni a operar en producción.

Esta política dice qué debe confirmarse antes de aprobar la identidad de una empresa. Cada decisión queda registrada con esta versión. Si la política cambia, cambia la versión; no se edita en el lugar.

## Qué significa aprobar

Aprobar un KYB confirma que **la empresa existe, es quien dice ser y que su representante puede actuar por ella**. No aprueba financiamiento, no asigna un puntaje y no garantiza nada. El riesgo se decide aparte (underwriting).

## Puntos a confirmar

| Punto | Obligatorio | Qué se comprueba |
| --- | --- | --- |
| Existencia legal | Sí | Está constituida y la razón social coincide |
| RUC activo y habido | Sí | Contribuyente activo, domicilio habido, número coincide con la razón social |
| Facultades del representante | Sí | El poder está vigente y alcanza para actuar por la empresa |
| Identidad del representante | Sí | El documento corresponde a la persona con poder |
| Beneficiarios finales | Sí | Hay declaración de quién controla la empresa |
| Domicilio fiscal | Sí | Coincide con la ficha RUC |
| Listas restrictivas y PEP | No (por ahora) | Sin coincidencias. Pasa a obligatorio al contratar un proveedor |

## Qué fuentes cuentan

| Fuente | Testnet | Producción |
| --- | --- | --- |
| Registro oficial | Sí | Sí |
| Proveedor externo | Sí | Sí |
| Revisión manual (el revisor consulta una fuente pública y lo anota) | Sí, con nota obligatoria | **No**, hasta decisión del dueño y de Legal |
| Solo declarado | **Nunca** | **Nunca** |
| Sintético (el sandbox) | **Nunca** | **Nunca** |

En una revisión manual la nota debe decir **qué se revisó, dónde y cuándo** (mínimo 20 caracteres). No se hace scraping de sitios de gobierno: consultar una fuente pública a mano, como persona, es distinto y es lo que cubre la revisión manual.

## Quién puede decidir

- **Revisor:** toma casos, revisa evidencia y pide información.
- **Aprobador:** además aprueba, rechaza y reabre.
- **Administrador:** gestiona al personal. No ve casos ni decide si no tiene también esos roles. No edita políticas: una política cambia por pull request, con nueva versión.
- Una persona puede tener varios roles. Nadie cambia su propio acceso.

## Separación de funciones

Quien tomó y preparó un caso **no puede aprobarlo ni rechazarlo**: debe hacerlo otra persona. En producción es obligatorio siempre. En Testnet, mientras haya un solo operador, se permite el **modo de un solo operador**: cada decisión queda marcada así y la pantalla lo advierte.

## Qué queda registrado

Cada decisión guarda, sin poder modificarse después: quién la tomó y quién preparó el caso, el modo de separación, la **versión de política** (`kyb-v1-draft`), los motivos, los puntos confirmados con su fuente y una **huella de la evidencia** (`evidenceSnapshotHash`). Si la evidencia cambia luego, la huella prueba en qué se basó la decisión.

Al aprobar, se publica en Stellar solo una credencial `KYB` con un compromiso: un hash con sal que no revela nada de la empresa. Nunca se publican el RUC, el representante, documentos ni notas.

## Estados de un caso

Recibido → En revisión → (Falta información | Aprobado | Rechazado). Un caso en Falta información, Aprobado, Rechazado o Revisión vencida puede reabrirse a En revisión, con una razón escrita. Un caso nuevo debe tomarse antes de decidir.

## Motivos

Todo rechazo o pedido de información lleva al menos un motivo de la lista; los motivos “otro” exigen explicación escrita. El mensaje que ve la empresa es fijo, no contiene datos personales ni cifras, y nunca promete financiamiento.

| Código | Decisión | Qué ve la empresa |
| --- | --- | --- |
| `POLICY_MET` | Aprobar | Tu empresa pasó la revisión de identidad. Esto no es una aprobación de financiamiento. |
| `MISSING_REP_AUTHORITY` | Pedir información | Necesitamos que acredites las facultades de tu representante legal. |
| `MISSING_OWNERSHIP` | Pedir información | Necesitamos que declares quiénes son los dueños o controlan la empresa. |
| `TAX_ID_MISMATCH` | Pedir información | El número tributario y la razón social no coinciden. Revisa y vuelve a enviar. |
| `ADDRESS_UNCLEAR` | Pedir información | El domicilio declarado no coincide con el de tu ficha tributaria. |
| `OTHER_INFO` | Pedir información | Necesitamos información adicional para continuar con la revisión. |
| `ENTITY_NOT_FOUND` | Rechazar | No pudimos confirmar la existencia de la empresa con los datos enviados. |
| `TAX_ID_INACTIVE` | Rechazar | La ficha tributaria de la empresa no figura como activa. |
| `REP_NOT_AUTHORIZED` | Rechazar | No pudimos confirmar que el representante pueda actuar por la empresa. |
| `INCONSISTENT_DATA` | Rechazar | Los datos enviados son inconsistentes y no pudimos completar la revisión. |
| `OUT_OF_SCOPE` | Rechazar | Por ahora no podemos revisar este tipo de empresa o país. |
| `OTHER_REJECT` | Rechazar | No pudimos completar la revisión de la empresa. |

La fuente de verdad de estos textos es `apps/admin/src/lib/kyb/reason-codes.ts`; esta tabla debe coincidir con ella.

## Vigencia y control

- **Vigencia de una aprobación:** 365 días; luego el caso pasa a Revisión vencida. *(Propuesta; Legal debe confirmar.)*
- **Ventana de cancelación:** 10 minutos entre aprobar y que se ponga en cola cualquier emisión on-chain. *(Disponible desde el incremento 4.)*

## Decisiones que necesito del dueño

1. ¿Se acepta la **revisión manual** como fuente en Testnet? (Propuesto: sí.)
2. ¿Se acepta la revisión manual en **producción**? (Propuesto: no, hasta que Legal lo avale.)
3. ¿**Listas restrictivas y PEP** pasan a obligatorias ya, aun sin proveedor? (Propuesto: no; sería imposible aprobar.)
4. ¿La vigencia de 365 días es la correcta?
5. ¿Quién es el **segundo contacto** que recibe aviso de cada aprobación?
6. Plazos de **retención** de declaraciones, notas del revisor y auditoría. (Requiere Legal; no se elige un plazo en el código.)
7. ¿Meta de **tiempo de respuesta** para la cola (por ejemplo, 3 días hábiles)?
