import { NextResponse } from 'next/server';
import { bookGymClass } from '@/lib/integrations/gym/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    classId?: string;
    guest?: string;
    roomNo?: string;
    date?: string;
  };

  if (!body.classId?.trim() || !body.guest?.trim() || !body.roomNo?.trim() || !body.date?.trim()) {
    return NextResponse.json({ ok: false, message: 'classId, guest, roomNo, date gerekli' }, { status: 400 });
  }

  return NextResponse.json(await bookGymClass({
    classId: body.classId,
    guest: body.guest,
    roomNo: body.roomNo,
    date: body.date,
  }));
}
