import { NextResponse } from 'next/server';
import { collectHealthStatus } from '@/lib/server/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await collectHealthStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
