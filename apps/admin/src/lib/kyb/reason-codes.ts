import type { DecisionKind } from './types';

export interface ReasonCode {
  code: string;
  kind: Extract<DecisionKind, 'Approve' | 'RequestInformation' | 'Reject'>;
  /** Shown to staff. */
  internal: string;
  /** Shown to the business. Plain language, no personal data, no financing claim. */
  userMessage: string;
  /** The reviewer must explain in free text. */
  needsNote?: boolean;
}

export const REASON_CODES: readonly ReasonCode[] = [
  {
    code: 'POLICY_MET',
    kind: 'Approve',
    internal: 'Se cumplen todos los puntos obligatorios de la política.',
    userMessage:
      'Tu empresa pasó la revisión de identidad. Esto no es una aprobación de financiamiento.',
  },
  {
    code: 'MISSING_REP_AUTHORITY',
    kind: 'RequestInformation',
    internal: 'Falta acreditar las facultades del representante.',
    userMessage: 'Necesitamos que acredites las facultades de tu representante legal.',
  },
  {
    code: 'MISSING_OWNERSHIP',
    kind: 'RequestInformation',
    internal: 'Falta la declaración de beneficiarios finales.',
    userMessage: 'Necesitamos que declares quiénes son los dueños o controlan la empresa.',
  },
  {
    code: 'TAX_ID_MISMATCH',
    kind: 'RequestInformation',
    internal: 'El número tributario no coincide con la razón social.',
    userMessage: 'El número tributario y la razón social no coinciden. Revisa y vuelve a enviar.',
  },
  {
    code: 'ADDRESS_UNCLEAR',
    kind: 'RequestInformation',
    internal: 'El domicilio no coincide con el de la ficha tributaria.',
    userMessage: 'El domicilio declarado no coincide con el de tu ficha tributaria.',
  },
  {
    code: 'OTHER_INFO',
    kind: 'RequestInformation',
    internal: 'Otra información pendiente (explicar).',
    userMessage: 'Necesitamos información adicional para continuar con la revisión.',
    needsNote: true,
  },
  {
    code: 'ENTITY_NOT_FOUND',
    kind: 'Reject',
    internal: 'No se encontró la entidad en una fuente aceptada.',
    userMessage: 'No pudimos confirmar la existencia de la empresa con los datos enviados.',
  },
  {
    code: 'TAX_ID_INACTIVE',
    kind: 'Reject',
    internal: 'Contribuyente de baja o domicilio no habido.',
    userMessage: 'La ficha tributaria de la empresa no figura como activa.',
  },
  {
    code: 'REP_NOT_AUTHORIZED',
    kind: 'Reject',
    internal: 'El representante no tiene facultades suficientes.',
    userMessage: 'No pudimos confirmar que el representante pueda actuar por la empresa.',
  },
  {
    code: 'INCONSISTENT_DATA',
    kind: 'Reject',
    internal: 'Los datos son inconsistentes entre sí.',
    userMessage: 'Los datos enviados son inconsistentes y no pudimos completar la revisión.',
  },
  {
    code: 'OUT_OF_SCOPE',
    kind: 'Reject',
    internal: 'Fuera del alcance actual (país o tipo de empresa).',
    userMessage: 'Por ahora no podemos revisar este tipo de empresa o país.',
  },
  {
    code: 'OTHER_REJECT',
    kind: 'Reject',
    internal: 'Otro motivo de rechazo (explicar).',
    userMessage: 'No pudimos completar la revisión de la empresa.',
    needsNote: true,
  },
];

const BY_CODE = new Map(REASON_CODES.map((r) => [r.code, r]));

export function reasonCode(code: string): ReasonCode | undefined {
  return BY_CODE.get(code);
}

export function reasonsFor(kind: ReasonCode['kind']): ReasonCode[] {
  return REASON_CODES.filter((r) => r.kind === kind);
}
