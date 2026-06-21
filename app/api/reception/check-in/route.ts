import { NextResponse } from 'next/server';
import { performAutomatedCheckIn } from '@/lib/integrations/hotspot5651/automation';

export async function POST(req: Request) {
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
  };

  if (!body.reservationId || !body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 });
  }

  const result = await performAutomatedCheckIn(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
