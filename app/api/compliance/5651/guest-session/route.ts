import { NextResponse } from 'next/server';
import { handleGuestHotspotSession } from '@/lib/integrations/hotspot5651/guest-session';
import type { GuestSessionRequest } from '@/lib/integrations/hotspot5651/guest-session';

export async function POST(req: Request) {
  const body = (await req.json()) as GuestSessionRequest;
  if (!body.roomNo || !body.guestName) {
    return NextResponse.json({ ok: false, message: 'roomNo ve guestName gerekli' }, { status: 400 });
  }
  if (body.action !== 'open' && body.action !== 'close') {
    return NextResponse.json({ ok: false, message: 'action: open | close' }, { status: 400 });
  }

  const result = await handleGuestHotspotSession(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
