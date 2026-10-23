import type { Actor, DecisionKind, StaffRole } from './types';

/**
 * Privy authenticates; Fondealo authorizes. A verified Privy session is only a
 * claim of identity. What that person may do comes from their active
 * `StaffMember` row and this table, nothing else.
 */
export type Action =
  | 'case.read'
  | 'case.claim'
  | 'case.requestInformation'
  | 'case.approve'
  | 'case.reject'
  | 'case.reopen'
  | 'taxId.reveal'
  | 'staff.manage';

const REVIEWER: readonly Action[] = [
  'case.read',
  'case.claim',
  'case.requestInformation',
  'taxId.reveal',
];

export const GRANTS: Record<StaffRole, readonly Action[]> = {
  Reviewer: REVIEWER,
  Approver: [...REVIEWER, 'case.approve', 'case.reject', 'case.reopen'],
  // Least privilege: managing people does not open anyone's case data. A
  // person who must do both holds both roles.
  Admin: ['staff.manage'],
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  Reviewer: 'Revisor',
  Approver: 'Aprobador',
  Admin: 'Administrador',
};

export function can(actor: Actor, action: Action): boolean {
  if (actor.status !== 'Active') return false;
  return actor.roles.some((r) => GRANTS[r].includes(action));
}

const ACTION_FOR: Record<DecisionKind, Action> = {
  Claim: 'case.claim',
  RequestInformation: 'case.requestInformation',
  Approve: 'case.approve',
  Reject: 'case.reject',
  Reopen: 'case.reopen',
};

export function actionFor(kind: DecisionKind): Action {
  return ACTION_FOR[kind];
}

export interface StaffChange {
  targetId: string;
  roles?: readonly StaffRole[];
  status?: Actor['status'];
}

/**
 * Rules for changing staff. Nobody changes their own access, and the last
 * active Admin cannot be removed, so the back-office can never lock itself out
 * or be quietly widened by one account.
 */
export function validateStaffChange(
  actor: Actor,
  change: StaffChange,
  target: Actor,
  activeAdmins: number,
): string[] {
  const errors: string[] = [];
  if (!can(actor, 'staff.manage')) errors.push('Solo un Administrador puede cambiar al personal.');
  if (actor.id === change.targetId) errors.push('Nadie puede cambiar su propio acceso.');
  if (change.roles && change.roles.length === 0) errors.push('Asigna al menos un rol.');
  const loses =
    target.status === 'Active' &&
    target.roles.includes('Admin') &&
    ((change.roles && !change.roles.includes('Admin')) ||
      (change.status !== undefined && change.status !== 'Active'));
  if (loses && activeAdmins <= 1) errors.push('No se puede quitar al último Administrador activo.');
  return errors;
}
