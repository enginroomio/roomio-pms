import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { nextReservationRefNoServer } from '@/lib/server/reservation-ref-no';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const refNo = await nextReservationRefNoServer(propertyId);
    return NextResponse.json({ ok: true, refNo });
  } catch {
    return NextResponse.json({ error: 'ref no failed' }, { status: 500 });
  }
}
