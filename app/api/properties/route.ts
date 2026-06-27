import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { getProperties } from '@/lib/server/pms-store';
import { getAccessiblePropertiesForUser } from '@/lib/server/user-properties';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const payload = await getJwtPayloadFromRequest(req);
  const properties = payload
    ? await getAccessiblePropertiesForUser(payload.sub, payload.role)
    : await getProperties();

  return NextResponse.json(
    { ok: true, properties },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
  );
}
