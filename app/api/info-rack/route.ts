import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getInfoRackServer } from '@/lib/server/info-rack';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const rows = await getInfoRackServer(propertyId);
    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    logApiError('GET /api/info-rack', err);
    return NextResponse.json({ error: 'info-rack fetch failed' }, { status: 500 });
  }
}
