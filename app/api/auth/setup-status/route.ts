import { NextResponse } from 'next/server';
import { getAuthSetupStatus } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getAuthSetupStatus();
  return NextResponse.json({ ok: true, ...status });
}
