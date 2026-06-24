import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getPropertyInventoryPayload } from '@/lib/server/room-inventory-bridge';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const payload = await getPropertyInventoryPayload(propertyId);
    return NextResponse.json({ ok: true, ...payload });
  } catch {
    return NextResponse.json({ error: 'inventory fetch failed' }, { status: 500 });
  }
}
