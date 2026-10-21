import type { KybState } from '@/lib/data/kyb';

export type StepKey = 'received' | 'identity' | 'risk' | 'passport';
export type StepState = 'done' | 'current' | 'upcoming' | 'blocked';

export type ApplicationStatusKind =
  | 'unavailable'
  | 'none'
  | 'processing'
  | 'rejected'
  | 'simulated'
  | 'identity-verified'
  | 'risk-declined'
  | 'verified';

export interface ApplicationStatus {
  kind: ApplicationStatusKind;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
  title: string;
  body: string;
  /** Null when the journey can't be placed on the timeline (no data, or a simulation). */
  steps: { key: StepKey; label: string; state: StepState }[] | null;
  /** The single next thing the business can do, if any. */
  action: { href: string; label: string } | null;
  /** Whether the intake form should be offered (first application or a retry). */
  canSubmit: boolean;
}

const STEP_LABELS: Record<StepKey, string> = {
  received: 'Solicitud recibida',
  identity: 'Verificación de identidad',
  risk: 'Evaluación',
  passport: 'Pasaporte emitido',
};

function steps(...states: StepState[]): ApplicationStatus['steps'] {
  const keys: StepKey[] = ['received', 'identity', 'risk', 'passport'];
  return keys.map((key, i) => ({ key, label: STEP_LABELS[key], state: states[i] ?? 'upcoming' }));
}

/**
 * Maps the server's KYB/underwriting state to what the business sees and can
 * do next. Pure on purpose: every branch is unit-tested, and nothing here can
 * promote a sandbox result to "verified" — only `eligible` (computed by
 * canRequestFinancing) reaches the verified state.
 */
export function applicationStatus(kyb: KybState | null): ApplicationStatus {
  if (!kyb) {
    return {
      kind: 'unavailable',
      tone: 'warning',
      title: 'No pudimos cargar el estado de tu solicitud',
      body: 'Tus datos no se perdieron. Vuelve a intentarlo en unos minutos.',
      steps: null,
      action: { href: '/business/verify', label: 'Reintentar' },
      canSubmit: false,
    };
  }

  if (kyb.eligible) {
    return {
      kind: 'verified',
      tone: 'success',
      title: 'Tu empresa está verificada',
      body: 'Tu Pasaporte está activo. Cada financiador toma su propia decisión sobre si te financia.',
      steps: steps('done', 'done', 'done', 'done'),
      action: { href: '/business/passport', label: 'Ver mi Pasaporte' },
      canSubmit: false,
    };
  }

  switch (kyb.status) {
    case 'None':
      return {
        kind: 'none',
        tone: 'neutral',
        title: 'Aún no has enviado tu solicitud',
        body: 'Registra tu empresa con su RUC. Te tomará unos minutos y no necesitas subir documentos todavía.',
        steps: steps('current'),
        action: { href: '/business/verify', label: 'Empezar mi solicitud' },
        canSubmit: true,
      };
    case 'Processing':
      return {
        kind: 'processing',
        tone: 'info',
        title: 'Tu solicitud está en revisión',
        body:
          kyb.provider === 'sandbox'
            ? 'Revisamos el formato de tus datos en modo de prueba. En esta versión todavía no hay un equipo revisando solicitudes, por eso no podemos darte un plazo. No necesitas hacer nada más por ahora.'
            : 'Estamos revisando la identidad de tu empresa. Te avisaremos si necesitamos algo más.',
        steps: steps('done', 'current'),
        action: null,
        canSubmit: false,
      };
    case 'Rejected':
      return {
        kind: 'rejected',
        tone: 'danger',
        title: 'No pudimos verificar tu empresa',
        body: 'Revisa que la razón social y el número tributario coincidan con tu registro y envía una nueva solicitud.',
        steps: steps('done', 'blocked'),
        action: { href: '/business/verify', label: 'Corregir y reenviar' },
        canSubmit: true,
      };
    case 'Accepted':
      if (kyb.provider === 'sandbox') {
        return {
          kind: 'simulated',
          tone: 'warning',
          title: 'Tu verificación anterior fue una simulación',
          body: 'Ese resultado del modo de prueba no cuenta como verificación real. Envía una nueva solicitud para que sea revisada.',
          steps: null,
          action: { href: '/business/verify', label: 'Enviar nueva solicitud' },
          canSubmit: true,
        };
      }
      if (kyb.underwritingStatus === 'Declined') {
        return {
          kind: 'risk-declined',
          tone: 'warning',
          title: 'Identidad verificada; la evaluación no fue aprobada',
          body: 'Verificar tu identidad no garantiza financiamiento. Podrás pedir una nueva evaluación más adelante.',
          steps: steps('done', 'done', 'blocked'),
          action: null,
          canSubmit: false,
        };
      }
      return {
        kind: 'identity-verified',
        tone: 'info',
        title: 'Identidad verificada; evaluación pendiente',
        body: 'Revisamos la identidad de tu empresa. Falta la evaluación antes de emitir tu Pasaporte.',
        steps: steps('done', 'done', 'current'),
        action: null,
        canSubmit: false,
      };
  }
}

/** Shown wherever status appears: verification is not a financing promise. */
export const NOT_A_FINANCING_PROMISE =
  'Verificar tu empresa no significa que recibirás financiamiento. Fondealo no presta dinero ni decide por los financiadores.';
