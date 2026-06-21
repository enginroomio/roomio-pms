import { NextResponse } from 'next/server';
import { performAutomatedCheckOut } from '@/lib/integrations/hotspot5651/automation';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomNo: string;
    guestName: string;
    reservationId?: string;
    pbx?: boolean;
  };

  if (!body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'roomNo ve guestName gerekli' }, { status: 400 });
  }

  const result = await performAutomatedCheckOut(body);
  return NextResponse.json(result);
}
