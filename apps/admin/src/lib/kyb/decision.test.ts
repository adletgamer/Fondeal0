import { describe, expect, it } from 'vitest';
import { validateDecision, type DecisionInput } from './decision';
import { REQUIRED_ITEM_IDS } from './policy';
import type { ChecklistAnswer, EvidenceSource } from './types';

const approver = { id: 'a1', roles: ['Approver'] as const, status: 'Active' as const };
const reviewer = { id: 'r1', roles: ['Reviewer'] as const, status: 'Active' as const };
const NOTE = 'Consulté la ficha RUC en el portal tributario el 22/10.';

const confirmed = (source: EvidenceSource, note = NOTE): ChecklistAnswer[] =>
  REQUIRED_ITEM_IDS.map((itemId) => ({ itemId, outcome: 'Confirmed', source, note }));

const base = (over: Partial<DecisionInput>): DecisionInput => ({
  kind: 'Approve',
  from: 'InReview',
  actor: approver,
  preparedBy: 'r1',
  separation: 'enforced',
  checklist: confirmed('official-registry'),
  reasonCodes: [],
  note: '',
  env: 'testnet',
  ...over,
});

const errors = (r: ReturnType<typeof validateDecision>) => (r.ok ? [] : r.errors);

describe('approving', () => {
  it('passes when every required item is confirmed by an accepted source', () => {
    const r = validateDecision(base({}));
    expect(r).toEqual({ ok: true, to: 'Approved', reasonCodes: ['POLICY_MET'] });
  });

  it('fails when a required item is missing or not confirmed', () => {
    const checklist = confirmed('official-registry').slice(1);
    expect(errors(validateDecision(base({ checklist }))).join(' ')).toContain('Falta confirmar');
    const notConfirmed = confirmed('official-registry').map((a, i) =>
      i === 0 ? { ...a, outcome: 'NotConfirmed' as const } : a,
    );
    expect(validateDecision(base({ checklist: notConfirmed })).ok).toBe(false);
  });

  it('never accepts declared-only evidence', () => {
    const r = validateDecision(base({ checklist: confirmed('declared-only') }));
    expect(r.ok).toBe(false);
    expect(errors(r).join(' ')).toContain('no confirma');
  });

  it('never accepts synthetic evidence, even on an optional item', () => {
    const extra: ChecklistAnswer = {
      itemId: 'screening',
      outcome: 'Confirmed',
      source: 'synthetic',
      note: '',
    };
    const r = validateDecision(base({ checklist: [...confirmed('official-registry'), extra] }));
    expect(r.ok).toBe(false);
    expect(errors(r).join(' ')).toContain('sintética');
  });

  it('manual review needs a note on every item, on Testnet only', () => {
    expect(validateDecision(base({ checklist: confirmed('reviewer-attested') })).ok).toBe(true);
    const short = validateDecision(base({ checklist: confirmed('reviewer-attested', 'ok') }));
    expect(short.ok).toBe(false);
    expect(errors(short).join(' ')).toContain('qué revisaste');
    const prod = validateDecision(
      base({ env: 'production', checklist: confirmed('reviewer-attested') }),
    );
    expect(prod.ok).toBe(false);
  });

  it('production still accepts a registry or provider', () => {
    expect(
      validateDecision(base({ env: 'production', checklist: confirmed('third-party') })).ok,
    ).toBe(true);
  });

  it('only an Approver may approve or reject', () => {
    expect(validateDecision(base({ actor: reviewer })).ok).toBe(false);
    expect(
      validateDecision(base({ kind: 'Reject', actor: reviewer, reasonCodes: ['TAX_ID_INACTIVE'] }))
        .ok,
    ).toBe(false);
  });

  it('cannot approve from any state but InReview', () => {
    for (const from of [
      'Received',
      'NeedsInformation',
      'Approved',
      'Rejected',
      'ReviewDue',
    ] as const) {
      expect(validateDecision(base({ from })).ok).toBe(false);
    }
  });

  it('ignores reason codes sent by the client: the code is always POLICY_MET', () => {
    const r = validateDecision(base({ reasonCodes: ['TAX_ID_INACTIVE'] }));
    expect(r).toMatchObject({ ok: true, reasonCodes: ['POLICY_MET'] });
  });
});

describe('asking for information and rejecting', () => {
  it('needs a reason of the right kind', () => {
    expect(validateDecision(base({ kind: 'Reject', reasonCodes: [] })).ok).toBe(false);
    expect(validateDecision(base({ kind: 'Reject', reasonCodes: ['MISSING_OWNERSHIP'] })).ok).toBe(
      false,
    );
    expect(validateDecision(base({ kind: 'Reject', reasonCodes: ['TAX_ID_INACTIVE'] })).ok).toBe(
      true,
    );
    expect(
      validateDecision(base({ kind: 'RequestInformation', reasonCodes: ['MISSING_OWNERSHIP'] })).ok,
    ).toBe(true);
  });

  it('rejects an unknown code and a mixed list', () => {
    expect(validateDecision(base({ kind: 'Reject', reasonCodes: ['MADE_UP'] })).ok).toBe(false);
    expect(
      validateDecision(
        base({ kind: 'Reject', reasonCodes: ['TAX_ID_INACTIVE', 'MISSING_OWNERSHIP'] }),
      ).ok,
    ).toBe(false);
  });

  it('“other” reasons must be explained', () => {
    expect(
      validateDecision(base({ kind: 'Reject', reasonCodes: ['OTHER_REJECT'], note: 'no' })).ok,
    ).toBe(false);
    expect(
      validateDecision(
        base({
          kind: 'Reject',
          reasonCodes: ['OTHER_REJECT'],
          note: 'La razón social no figura en ninguna fuente.',
        }),
      ).ok,
    ).toBe(true);
  });

  it('can only ask for information while the case is in review', () => {
    expect(
      validateDecision(
        base({
          kind: 'RequestInformation',
          from: 'Received',
          reasonCodes: ['OTHER_INFO'],
          note: NOTE,
        }),
      ).ok,
    ).toBe(false);
  });
});

describe('claiming and reopening', () => {
  it('claim needs nothing else, but only on a received case', () => {
    expect(
      validateDecision(base({ kind: 'Claim', from: 'Received', actor: reviewer, checklist: [] }))
        .ok,
    ).toBe(true);
    expect(validateDecision(base({ kind: 'Claim', from: 'InReview' })).ok).toBe(false);
  });

  it('reopening needs a written reason', () => {
    expect(validateDecision(base({ kind: 'Reopen', from: 'Rejected', note: '' })).ok).toBe(false);
    expect(
      validateDecision(
        base({ kind: 'Reopen', from: 'Rejected', note: 'La empresa envió el poder vigente.' }),
      ),
    ).toMatchObject({ ok: true, to: 'InReview' });
  });
});

describe('roles and separation of duties', () => {
  it('a suspended or revoked approver can do nothing', () => {
    for (const status of ['Suspended', 'Revoked'] as const) {
      expect(validateDecision(base({ actor: { ...approver, status } })).ok).toBe(false);
      expect(
        validateDecision(base({ kind: 'Claim', from: 'Received', actor: { ...reviewer, status } }))
          .ok,
      ).toBe(false);
    }
  });

  it('an Admin alone cannot touch cases', () => {
    const admin = { id: 'x', roles: ['Admin'] as const, status: 'Active' as const };
    expect(validateDecision(base({ actor: admin })).ok).toBe(false);
    expect(validateDecision(base({ kind: 'Claim', from: 'Received', actor: admin })).ok).toBe(
      false,
    );
  });

  it('whoever prepared the case cannot approve or reject it when enforced', () => {
    const r = validateDecision(base({ preparedBy: approver.id }));
    expect(r.ok).toBe(false);
    expect(errors(r).join(' ')).toContain('otra persona');
    expect(
      validateDecision(
        base({ kind: 'Reject', preparedBy: approver.id, reasonCodes: ['TAX_ID_INACTIVE'] }),
      ).ok,
    ).toBe(false);
  });

  it('allows the same person in solo mode', () => {
    expect(validateDecision(base({ preparedBy: approver.id, separation: 'solo' })).ok).toBe(true);
  });

  it('separation does not block asking for information', () => {
    expect(
      validateDecision(
        base({
          kind: 'RequestInformation',
          preparedBy: approver.id,
          reasonCodes: ['MISSING_OWNERSHIP'],
        }),
      ).ok,
    ).toBe(true);
  });
});
