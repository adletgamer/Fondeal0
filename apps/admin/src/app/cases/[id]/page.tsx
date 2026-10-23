import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChecksPanel, CompanyPanel, EvidencePanel, Timeline } from '@/components/case-detail';
import { DecisionPanel } from '@/components/decision-panel';
import { Shell } from '@/components/shell';
import { StatusChip } from '@/components/status-chip';
import { requireStaff } from '@/lib/auth/staff';
import { getCase } from '@/lib/data';
import { CAPABILITIES, adminEnv, separationMode } from '@/lib/env';
import { ageLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const now = new Date();
  const c = await getCase(id, now);
  if (!c) notFound();
  const env = adminEnv();

  return (
    <Shell staff={staff} env={env} active="/">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-ink"
      >
        ← Cola de revisión
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{c.legalName}</h1>
        <StatusChip status={c.status} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">Recibido {ageLabel(c.submittedAt, now)}</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <CompanyPanel c={c} audited={CAPABILITIES.persistsDecisions} />
          <EvidencePanel c={c} />
          <ChecksPanel c={c} />
          <Timeline c={c} now={now} />
        </div>
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-2xl">
          <DecisionPanel
            legalName={c.legalName}
            status={c.status}
            actor={{ id: staff.id, roles: staff.roles, status: staff.status }}
            preparedBy={c.preparedBy}
            separation={separationMode()}
            env={env}
            capabilities={CAPABILITIES}
          />
        </div>
      </div>
    </Shell>
  );
}
