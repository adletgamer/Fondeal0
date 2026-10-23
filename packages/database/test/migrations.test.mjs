// Applies every migration, in order, to an embedded Postgres (PGlite) and
// checks the invariants the back-office relies on (docs/adr/0011). Runs with
// `node --test`; needs no database server and no credentials.
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';

const dir = join(import.meta.dirname, '../prisma/migrations');
let db;

const rejects = (sql, pattern) => assert.rejects(() => db.exec(sql), pattern);

const decision = (o) => {
  const v = {
    kind: 'Approve',
    from: 'InReview',
    to: 'Approved',
    actor: 'approver',
    prepared: 'reviewer',
    mode: 'enforced',
    commit: '0xc',
    salt: 's',
    exp: '2027-10-22',
    ...o,
  };
  const q = (x) => (x === null ? 'NULL' : `'${x}'`);
  return `INSERT INTO "KybDecision"(id,"businessId","kybSubmissionId",kind,"fromStatus","toStatus","actorStaffId","preparedByStaffId","separationMode","policyVersion","reasonCodes",checklist,"evidenceSnapshotHash","credentialCommitment","commitmentSalt","idempotencyKey","expiresAt")
    VALUES (${q(v.id)},'b1','s1',${q(v.kind)},${q(v.from)},${q(v.to)},${q(v.actor)},${q(v.prepared)},${q(v.mode)},'kyb-v1-draft','[]','[]','0xabc',${q(v.commit)},${q(v.salt)},${q(v.id + '-key')},${q(v.exp)});`;
};

before(async () => {
  db = new PGlite();
  for (const m of readdirSync(dir)
    .filter((d) => !d.endsWith('.toml'))
    .sort()) {
    await db.exec(readFileSync(join(dir, m, 'migration.sql'), 'utf8'));
  }
  await db.exec(`
    INSERT INTO "Business"(id,"stellarAddress","legalName",country,"updatedAt") VALUES ('b1','GADDR','Kallpa Labs SAC','Peru',now());
    INSERT INTO "KybSubmission"(id,"businessId",fields) VALUES ('s1','b1','{}');
    INSERT INTO "StaffMember"(id,"privyUserId",email,roles,"updatedAt") VALUES
      ('approver','did:privy:a','a@example.com','{Approver,Admin}',now()),
      ('reviewer','did:privy:r','r@example.com','{Reviewer}',now());`);
});

describe('staff', () => {
  it('everyone holds at least one role', () =>
    rejects(
      `INSERT INTO "StaffMember"(id,"privyUserId",email,roles,"updatedAt") VALUES ('z','did:privy:z','z@example.com','{}',now());`,
      /roles_not_empty/,
    ));

  it('one row per Privy user', () =>
    rejects(
      `INSERT INTO "StaffMember"(id,"privyUserId",email,roles,"updatedAt") VALUES ('y','did:privy:a','y@example.com','{Reviewer}',now());`,
      /privyUserId_key/,
    ));

  it('staff with decisions can be suspended but never deleted', async () => {
    await db.exec(
      decision({
        id: 'claim',
        kind: 'Claim',
        from: 'Received',
        to: 'InReview',
        actor: 'reviewer',
        prepared: null,
        commit: null,
        salt: null,
        exp: null,
      }),
    );
    await rejects(`DELETE FROM "StaffMember" WHERE id='reviewer';`, /foreign key/);
    await db.exec(`UPDATE "StaffMember" SET status='Suspended' WHERE id='reviewer';`);
    await db.exec(`UPDATE "StaffMember" SET status='Active' WHERE id='reviewer';`);
  });
});

describe('KYB decisions', () => {
  it('an approval by a second person, with commitment, salt and expiry, is stored', () =>
    db.exec(decision({ id: 'ok' })));

  it('an approval always carries commitment, salt and expiry', async () => {
    await rejects(decision({ id: 'n1', commit: null, salt: null, exp: null }), /approval_fields/);
    await rejects(decision({ id: 'n2', salt: null }), /approval_fields/);
    await rejects(decision({ id: 'n3', exp: null }), /approval_fields/);
  });

  it('only an approval carries them', () =>
    rejects(decision({ id: 'n4', kind: 'Reject', to: 'Rejected' }), /approval_fields/));

  it('under enforced separation, whoever prepared the case cannot approve or reject it', async () => {
    await rejects(decision({ id: 'n5', prepared: 'approver' }), /maker_checker/);
    await rejects(
      decision({
        id: 'n6',
        kind: 'Reject',
        to: 'Rejected',
        prepared: 'approver',
        commit: null,
        salt: null,
        exp: null,
      }),
      /maker_checker/,
    );
  });

  it('a single operator may in solo mode', () =>
    db.exec(decision({ id: 'solo', prepared: 'approver', mode: 'solo' })));

  it('rejects an unknown separation mode', () =>
    rejects(decision({ id: 'n7', mode: 'off' }), /separation_mode/));

  it('rejects a replayed idempotency key', async () => {
    await rejects(decision({ id: 'ok' }), /pkey|idempotencyKey/);
  });

  it('is append-only', async () => {
    await rejects(`UPDATE "KybDecision" SET "toStatus"='Rejected' WHERE id='ok';`, /append-only/);
    await rejects(`DELETE FROM "KybDecision" WHERE id='ok';`, /append-only/);
  });
});

describe('staff audit events', () => {
  it('are append-only', async () => {
    await db.exec(
      `INSERT INTO "StaffAuditEvent"(id,"actorStaffId",action,"targetStaffId",metadata) VALUES ('e1','approver','staff.suspend','reviewer','{}');`,
    );
    await rejects(`UPDATE "StaffAuditEvent" SET action='x' WHERE id='e1';`, /append-only/);
    await rejects(`DELETE FROM "StaffAuditEvent" WHERE id='e1';`, /append-only/);
  });
});
