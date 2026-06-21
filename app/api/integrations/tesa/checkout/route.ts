import { NextResponse } from 'next/server';
import { checkoutGuest, copyGuestKey } from '@/lib/integrations/tesa/client';

export async function POST(req: Request) {
  const body = (await req.json()) as { action: 'checkout' | 'copy'; roomNo: string; keyCount?: number };
  if (!body.roomNo) return NextResponse.json({ ok: false, message: 'roomNo gerekli' }, { status: 400 });

  const result =
    body.action === 'copy'
      ? await copyGuestKey(body.roomNo, body.keyCount ?? 1)
      : await checkoutGuest(body.roomNo);

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
