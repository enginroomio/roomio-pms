import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getVipGuestsServer, saveVipGuestServer, deleteVipGuestServer } from '@/lib/server/vip-guests';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') ?? undefined;

  try {
    const guests = await getVipGuestsServer(propertyId, level);
    return NextResponse.json({ ok: true, guests });
  } catch {
    return NextResponse.json({ error: 'vip fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    level?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    guestName?: string;
    country?: string;
    arrival?: string;
    departure?: string;
    nights?: number;
    room?: string;
    status?: string;
    reservationId?: string;
  };

  if (!body.guestName || !body.level || !body.room) {
    return NextResponse.json({ error: 'guestName, level, room gerekli' }, { status: 400 });
  }

  try {
    const guest = await saveVipGuestServer({
      level: body.level,
      guestName: body.guestName,
      country: body.country ?? '—',
      arrival: body.arrival ?? '—',
      departure: body.departure ?? '—',
      nights: body.nights ?? 1,
      room: body.room,
      status: (body.status as 'Konaklıyor') ?? 'Konaklayacak',
      reservationId: body.reservationId,
    }, propertyId);
    return NextResponse.json({ ok: true, guest });
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

  const ok = await deleteVipGuestServer(id, propertyId);
  if (!ok) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
