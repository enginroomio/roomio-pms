import { NextResponse } from 'next/server';
import { bookSpaTreatment } from '@/lib/spa/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    treatmentId?: string;
    guest?: string;
    roomNo?: string;
    date?: string;
    time?: string;
    party?: number;
  };

  if (!body.treatmentId || !body.guest || !body.roomNo || !body.date || !body.time) {
    return NextResponse.json({ ok: false, message: 'treatmentId, guest, roomNo, date, time gerekli' }, { status: 400 });
  }

  return NextResponse.json(await bookSpaTreatment({
    treatmentId: body.treatmentId,
    guest: body.guest,
    roomNo: body.roomNo,
    date: body.date,
    time: body.time,
    party: body.party,
  }));
}
