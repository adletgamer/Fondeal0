import { NextResponse } from 'next/server';
import { prisma } from '@fondealo/database';

export const dynamic = 'force-dynamic';

/** Liveness probe: proves the deployed app can reach Postgres through Prisma. Never returns connection details. */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'up', ms: Date.now() - startedAt });
  } catch (err) {
    console.error('[health] database check failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 });
  }
}
