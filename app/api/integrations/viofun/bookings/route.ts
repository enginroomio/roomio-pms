import { NextResponse } from 'next/server';
import { bookViofunActivity } from '@/lib/integrations/viofun/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    activityId?: string;
    guest?: string;
    roomNo?: string;
    date?: string;
    time?: string;
    party?: number;
  };

  if (!body.activityId || !body.guest || !body.roomNo || !body.date || !body.time) {
    return NextResponse.json({ ok: false, message: 'activityId, guest, roomNo, date, time gerekli' }, { status: 400 });
  }

  return NextResponse.json(await bookViofunActivity({
    activityId: body.activityId,
    guest: body.guest,
    roomNo: body.roomNo,
    date: body.date,
    time: body.time,
    party: body.party,
  }));
}
