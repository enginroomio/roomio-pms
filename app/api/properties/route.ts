import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { getProperties } from '@/lib/server/pms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const properties = await getProperties();
  return NextResponse.json(
    { ok: true, properties },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
  );
}
