import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { addIcalFeed, loadIcalFeeds, removeIcalFeed } from '@/lib/integrations/ical-import/client';
import type { IcalChannel } from '@/lib/integrations/ical-import/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadIcalFeeds());
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { label?: string; channel?: IcalChannel; roomType?: string; url?: string };
  if (!body.label?.trim() || !body.url?.trim()) {
    return NextResponse.json({ ok: false, message: 'Etiket ve link gerekli' }, { status: 400 });
  }

  const feed = await addIcalFeed({
    label: body.label.trim(),
    channel: body.channel ?? 'other',
    roomType: body.roomType?.trim() || 'DBL',
    url: body.url.trim(),
  });
  return NextResponse.json({ ok: true, feed });
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  const { id } = (await req.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ ok: false, message: 'id gerekli' }, { status: 400 });
  }
  await removeIcalFeed(id);
  return NextResponse.json({ ok: true });
}
