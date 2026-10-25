import { describe, expect, it } from 'vitest';
import { GRANTS, can, validateStaffChange } from './authz';
import type { Actor } from './types';

const active = (id: string, roles: Actor['roles']): Actor => ({ id, roles, status: 'Active' });

describe('authorization', () => {
  it('an approver can do everything a reviewer can, plus decide', () => {
    for (const a of GRANTS.Reviewer) expect(GRANTS.Approver).toContain(a);
    expect(can(active('a', ['Approver']), 'case.approve')).toBe(true);
    expect(can(active('r', ['Reviewer']), 'case.approve')).toBe(false);
    expect(can(active('r', ['Reviewer']), 'case.requestInformation')).toBe(true);
  });

  it('an admin manages people and nothing else', () => {
    expect(GRANTS.Admin).toEqual(['staff.manage']);
    expect(can(active('x', ['Admin']), 'case.read')).toBe(false);
    expect(can(active('x', ['Admin', 'Approver']), 'case.approve')).toBe(true);
  });

  it('no role works while the person is not active', () => {
    for (const status of ['Suspended', 'Revoked'] as const) {
      expect(can({ id: 'a', roles: ['Approver', 'Admin'], status }, 'case.read')).toBe(false);
      expect(can({ id: 'a', roles: ['Admin'], status }, 'staff.manage')).toBe(false);
    }
  });
});

describe('staff changes', () => {
  const admin = active('admin', ['Admin']);
  const other = active('other', ['Admin']);
  const reviewer = active('rev', ['Reviewer']);

  it('only an admin may change staff', () => {
    expect(
      validateStaffChange(reviewer, { targetId: 'x', roles: ['Approver'] }, reviewer, 2),
    ).not.toEqual([]);
    expect(
      validateStaffChange(admin, { targetId: 'rev', roles: ['Approver'] }, reviewer, 1),
    ).toEqual([]);
  });

  it('nobody changes their own access', () => {
    const e = validateStaffChange(
      admin,
      { targetId: 'admin', roles: ['Admin', 'Approver'] },
      admin,
      2,
    );
    expect(e.join(' ')).toContain('propio acceso');
  });

  it('the last active admin cannot be removed or demoted', () => {
    expect(
      validateStaffChange(admin, { targetId: 'other', status: 'Suspended' }, other, 1).join(' '),
    ).toContain('último Administrador');
    expect(
      validateStaffChange(admin, { targetId: 'other', roles: ['Reviewer'] }, other, 1).join(' '),
    ).toContain('último Administrador');
    expect(
      validateStaffChange(admin, { targetId: 'other', status: 'Suspended' }, other, 2),
    ).toEqual([]);
  });

  it('a person always keeps at least one role', () => {
    expect(
      validateStaffChange(admin, { targetId: 'rev', roles: [] }, reviewer, 2).join(' '),
    ).toContain('al menos un rol');
  });
});
