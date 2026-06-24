import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getGrInHouseServer } from '@/lib/server/gr-inhouse';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const data = await getGrInHouseServer(propertyId);
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ error: 'gr-inhouse fetch failed' }, { status: 500 });
  }
}
