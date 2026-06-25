import { NextResponse } from 'next/server';
import { kioskCheckIn } from '@/lib/kiosk/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string };
  if (!body.token?.trim()) {
    return NextResponse.json({ ok: false, message: 'token gerekli' }, { status: 400 });
  }
  return NextResponse.json(await kioskCheckIn(body.token));
}
