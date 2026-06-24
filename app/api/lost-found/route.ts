import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { deliverLostFoundServer, deleteLostFoundServer, getLostFoundServer, saveLostFoundServer } from '@/lib/server/lost-found';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const items = await getLostFoundServer(propertyId);
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ error: 'lost-found fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: string;
    id?: string;
    type?: 'Kayıp' | 'Buluntu';
    item?: string;
    location?: string;
    guest?: string;
    roomNo?: string;
    status?: 'Açık' | 'Teslim';
    date?: string;
  };

  try {
    if (body.action === 'deliver' && body.id) {
      const item = await deliverLostFoundServer(body.id, propertyId);
      if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
      return NextResponse.json({ ok: true, item });
    }

    if (!body.type || !body.item || !body.location) {
      return NextResponse.json({ error: 'type, item, location gerekli' }, { status: 400 });
    }

    const item = await saveLostFoundServer({
      id: body.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      type: body.type,
      item: body.item,
      location: body.location,
      guest: body.guest,
      roomNo: body.roomNo,
      status: body.status ?? 'Açık',
    }, propertyId);
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  const ok = await deleteLostFoundServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
