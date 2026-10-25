import { Shell } from '@/components/shell';
import { CaseQueue } from '@/components/case-queue';
import { requireStaff } from '@/lib/auth/staff';
import { listCases } from '@/lib/data';
import { adminEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const staff = await requireStaff();
  const { estado } = await searchParams;
  const now = new Date();
  const cases = await listCases(now);

  return (
    <Shell staff={staff} env={adminEnv()} active="/">
      <CaseQueue cases={cases} filter={estado ?? 'todos'} now={now} />
    </Shell>
  );
}
