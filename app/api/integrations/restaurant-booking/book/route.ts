import { NextResponse } from 'next/server';
import { bookRestaurantTable } from '@/lib/integrations/restaurant-booking/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    guest?: string;
    roomNo?: string;
    date?: string;
    time?: string;
    party?: number;
    tableId?: string;
    notes?: string;
  };

  if (!body.guest?.trim() || !body.date?.trim() || !body.time?.trim() || !body.party) {
    return NextResponse.json({ ok: false, message: 'guest, date, time, party gerekli' }, { status: 400 });
  }

  return NextResponse.json(await bookRestaurantTable({
    guest: body.guest,
    roomNo: body.roomNo,
    date: body.date,
    time: body.time,
    party: Number(body.party),
    tableId: body.tableId,
    notes: body.notes,
  }));
}
