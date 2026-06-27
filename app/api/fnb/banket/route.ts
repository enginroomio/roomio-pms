import { NextResponse } from 'next/server';
import { requireApiAnyPermission, requireApiAuth, requireApiPermission } from '@/lib/auth/require-permission';
import {
  confirmBanketEventServer,
  getBanketEventsServer,
  postBanketEventToFolioServer,
  saveBanketEventServer,
} from '@/lib/server/banket-events';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const events = await getBanketEventsServer(propertyId);
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    logApiError('GET /api/fnb/banket', err);
    return NextResponse.json({ error: 'banket fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: 'postFolio' | 'confirm';
    id?: string;
    reservationId?: string;
    eventName?: string;
    hall?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    pax?: number;
    contact?: string;
    status?: 'confirmed' | 'option' | 'cancelled';
    revenue?: number;
  };

  if (body.action === 'postFolio') {
    const auth = await requireApiAnyPermission(req, ['cash.write', 'reservations.write']);
    if (auth instanceof NextResponse) return auth;
    if (!body.id || !body.reservationId) {
      return NextResponse.json({ error: 'id ve reservationId gerekli' }, { status: 400 });
    }
    try {
      const result = await postBanketEventToFolioServer(
        body.id,
        body.reservationId,
        propertyId,
        auth.user.name,
      );
      if (!result) return NextResponse.json({ error: 'Etkinlik bulunamadı veya gelir yok' }, { status: 404 });
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      logApiError('POST /api/fnb/banket', err);
      return NextResponse.json({ error: 'folio post failed' }, { status: 500 });
    }
  }

  if (body.action === 'confirm') {
    const auth = await requireApiPermission(req, 'reservations.write');
    if (auth instanceof NextResponse) return auth;
    if (!body.id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    const event = await confirmBanketEventServer(body.id, propertyId);
    if (!event) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, event });
  }

  const auth = await requireApiPermission(req, 'reservations.write');
  if (auth instanceof NextResponse) return auth;

  if (!body.eventName || !body.hall || !body.contact) {
    return NextResponse.json({ error: 'eventName, hall, contact gerekli' }, { status: 400 });
  }

  try {
    const event = await saveBanketEventServer({
      eventName: body.eventName,
      hall: body.hall,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      startTime: body.startTime ?? '19:00',
      endTime: body.endTime ?? '23:00',
      pax: body.pax ?? 50,
      contact: body.contact,
      status: body.status ?? 'option',
      revenue: body.revenue ?? 0,
    }, propertyId);
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    logApiError('POST /api/fnb/banket', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
