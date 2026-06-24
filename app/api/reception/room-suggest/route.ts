import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { suggestRoomsForCheckIn } from '@/lib/server/reception-ops';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservationId');

  if (!reservationId) {
    return NextResponse.json({ error: 'reservationId gerekli' }, { status: 400 });
  }

  try {
    const suggestions = await suggestRoomsForCheckIn(reservationId, propertyId);
    return NextResponse.json({ ok: true, suggestions });
  } catch {
    return NextResponse.json({ error: 'room suggest failed' }, { status: 500 });
  }
}
