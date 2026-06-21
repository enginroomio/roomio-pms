import { NextResponse } from 'next/server';
import { encodeGuestKey, loadTesaConfig, testTesaConnection } from '@/lib/integrations/tesa/client';
import type { TesaEncodeRequest } from '@/lib/integrations/tesa/types';

export async function POST(req: Request) {
  const body = (await req.json()) as TesaEncodeRequest;
  if (!body.roomNo || !body.guestName || !body.checkIn || !body.checkOut) {
    return NextResponse.json({ ok: false, message: 'Eksik alan' }, { status: 400 });
  }
  const result = await encodeGuestKey(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function GET() {
  const config = await loadTesaConfig();
  const result = await testTesaConnection(config);
  return NextResponse.json({ config, connection: result });
}
