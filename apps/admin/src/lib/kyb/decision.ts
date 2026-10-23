import { nextStatus, KIND_LABEL, STATUS_LABEL } from './states';
import {
  MIN_NOTE_LENGTH,
  POLICY_ITEMS,
  REQUIRED_ITEM_IDS,
  SOURCE_LABEL,
  acceptedSources,
} from './policy';
import { reasonCode } from './reason-codes';
import { actionFor, can } from './authz';
import type {
  Actor,
  AdminEnv,
  CaseStatus,
  ChecklistAnswer,
  DecisionKind,
  SeparationMode,
} from './types';

export interface DecisionInput {
  kind: DecisionKind;
  from: CaseStatus;
  actor: Actor;
  /** Who claimed and prepared the case, if anyone. */
  preparedBy: string | null;
  separation: SeparationMode;
  checklist: ChecklistAnswer[];
  reasonCodes: string[];
  note: string;
  env: AdminEnv;
}

export type DecisionCheck =
  { ok: true; to: CaseStatus; reasonCodes: string[] } | { ok: false; errors: string[] };

const itemLabel = (id: string) => POLICY_ITEMS.find((i) => i.id === id)?.label ?? id;

/**
 * The single place that decides whether a decision may be recorded. The UI
 * runs it to explain what is missing; the server action will run it again and
 * treat it as the authority. Pure on purpose, so it can be tested exhaustively.
 */
export function validateDecision(input: DecisionInput): DecisionCheck {
  const { kind, from, actor, checklist, env } = input;
  const note = input.note.trim();
  const errors: string[] = [];

  const to = nextStatus(from, kind);
  if (!to) {
    errors.push(`No se puede ${KIND_LABEL[kind]} un caso en estado “${STATUS_LABEL[from]}”.`);
    return { ok: false, errors };
  }

  if (!can(actor, actionFor(kind))) {
    errors.push(
      kind === 'Approve' || kind === 'Reject' || kind === 'Reopen'
        ? `Solo un Aprobador activo puede ${KIND_LABEL[kind]}.`
        : `Tu rol no permite ${KIND_LABEL[kind]}.`,
    );
  }

  // Maker-checker: whoever prepared the case does not also decide it.
  if (
    (kind === 'Approve' || kind === 'Reject') &&
    input.separation === 'enforced' &&
    input.preparedBy === actor.id
  ) {
    errors.push(
      'Quien preparó el caso no puede decidirlo. Debe aprobarlo o rechazarlo otra persona.',
    );
  }

  let reasonCodes = input.reasonCodes;

  if (kind === 'Approve') {
    reasonCodes = ['POLICY_MET'];
    const accepted = acceptedSources(env);
    for (const id of REQUIRED_ITEM_IDS) {
      const a = checklist.find((c) => c.itemId === id);
      if (!a || a.outcome !== 'Confirmed') {
        errors.push(`Falta confirmar: ${itemLabel(id)}.`);
        continue;
      }
      if (!a.source || !accepted.includes(a.source)) {
        errors.push(
          `${itemLabel(id)}: la fuente “${a.source ? SOURCE_LABEL[a.source] : 'sin fuente'}” no confirma este punto.`,
        );
      } else if (a.source === 'reviewer-attested' && a.note.trim().length < MIN_NOTE_LENGTH) {
        errors.push(
          `${itemLabel(id)}: explica qué revisaste, dónde y cuándo (mín. ${MIN_NOTE_LENGTH} caracteres).`,
        );
      }
    }
    // Synthetic evidence never confirms anything, even on an optional item.
    for (const a of checklist) {
      if (a.outcome === 'Confirmed' && a.source === 'synthetic') {
        errors.push(`${itemLabel(a.itemId)}: la evidencia sintética nunca confirma un punto.`);
      }
    }
  }

  if (kind === 'RequestInformation' || kind === 'Reject') {
    const wanted = kind;
    const valid = reasonCodes.map((c) => reasonCode(c)).filter((r) => r?.kind === wanted);
    if (valid.length === 0 || valid.length !== reasonCodes.length) {
      errors.push('Elige al menos un motivo de la lista.');
    } else if (valid.some((r) => r?.needsNote) && note.length < MIN_NOTE_LENGTH) {
      errors.push(`Explica el motivo (mín. ${MIN_NOTE_LENGTH} caracteres).`);
    }
  }

  if (kind === 'Reopen' && note.length < MIN_NOTE_LENGTH) {
    errors.push(`Indica por qué se reabre el caso (mín. ${MIN_NOTE_LENGTH} caracteres).`);
  }

  return errors.length ? { ok: false, errors } : { ok: true, to, reasonCodes };
}
