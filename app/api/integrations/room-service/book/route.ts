import { NextResponse } from 'next/server';
import { placeRoomServiceOrder } from '@/lib/integrations/room-service/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    items?: Array<{ menuItemId?: string; qty?: number }>;
    notes?: string;
  };

  if (!body.token?.trim() || !body.items?.length) {
    return NextResponse.json({ ok: false, message: 'token ve items gerekli' }, { status: 400 });
  }

  const items = body.items
    .filter((i) => i.menuItemId?.trim() && i.qty)
    .map((i) => ({ menuItemId: i.menuItemId as string, qty: Number(i.qty) }));

  const result = await placeRoomServiceOrder({ token: body.token, items, notes: body.notes });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
