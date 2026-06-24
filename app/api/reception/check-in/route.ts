import { NextResponse } from 'next/server';
import { performAutomatedCheckIn } from '@/lib/integrations/hotspot5651/automation';
import { checkInReservationServer } from '@/lib/server/folio-cash';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);

  const body = (await req.json()) as {
    reservationId: string;
    roomNo: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    reservationRef: string;
    tesa?: boolean;
    hotspot?: boolean;
    pbx?: boolean;
    extraChargeCodes?: string[];
  };

  if (!body.reservationId || !body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 });
  }

  const result = await performAutomatedCheckIn(body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  try {
    await checkInReservationServer(
      body.reservationId,
      body.roomNo,
      propertyId,
      user.name,
      body.extraChargeCodes ?? [],
    );
  } catch (err) {
    return NextResponse.json({
      ok: false,
      messages: [...result.messages, `DB: ${err instanceof Error ? err.message : 'check-in kaydı başarısız'}`],
    }, { status: 500 });
  }

  return NextResponse.json(result);
}
