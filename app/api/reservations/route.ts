import { NextResponse } from 'next/server';
import {
  addReservationServer,
  getAllReservationsServer,
  getReservationByIdServer,
  updateReservationServer,
} from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { validateMarketForReservation } from '@/lib/server/reservation-validation';
import { nextReservationRefNoServer } from '@/lib/server/reservation-ref-no';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { hasPermission } from '@/lib/auth/roles';
import { archiveGuestFromReservation } from '@/lib/server/guest-identity-archive';
import type { Reservation } from '@/lib/types/reservation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const reservation = await getReservationByIdServer(id, propertyId);
    if (!reservation) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, reservation });
  }
  const rows = await getAllReservationsServer(propertyId);
  return NextResponse.json({ ok: true, reservations: rows, count: rows.length });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  if (!hasPermission(user, 'reservations.write')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Reservation;
    if (!body.guestName || !body.checkIn || !body.checkOut) {
      return NextResponse.json({ error: 'guestName, checkIn, checkOut required' }, { status: 400 });
    }
    const marketError = await validateMarketForReservation(body.market, propertyId);
    if (marketError) return NextResponse.json({ error: marketError }, { status: 400 });

    const refNo = body.refNo?.trim()
      || await nextReservationRefNoServer(propertyId);

    const extraData = { ...(body.extraData ?? {}) };
    if (!extraData.createdBy && user.name) {
      extraData.createdBy = user.name;
    }

    const saved = await addReservationServer({
      ...body,
      id: body.id || `srv-${Date.now()}`,
      refNo,
      adults: body.adults ?? 1,
      children: body.children ?? 0,
      mealPlan: body.mealPlan ?? 'BB',
      createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
      currency: body.currency ?? 'TRY',
      status: body.status ?? 'CONFIRMED',
      agency: body.agency ?? 'DIRECT',
      market: body.market ?? 'FIT',
      extraData: Object.keys(extraData).length ? extraData : undefined,
    }, propertyId);
    void archiveGuestFromReservation(propertyId, {
      id: saved.id,
      guestName: saved.guestName,
      email: saved.email,
      phone: saved.phone,
      checkOut: saved.checkOut,
      extraData: saved.extraData,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, reservation: saved });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  if (!hasPermission(user, 'reservations.write')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Partial<Reservation> & { id?: string };
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const existing = await getReservationByIdServer(body.id, propertyId);
    if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const market = body.market !== undefined ? body.market : existing.market;
    const marketError = await validateMarketForReservation(market, propertyId);
    if (marketError) return NextResponse.json({ error: marketError }, { status: 400 });

    const saved = await updateReservationServer(body.id, body, propertyId);
    if (!saved) return NextResponse.json({ error: 'not found' }, { status: 404 });
    void archiveGuestFromReservation(propertyId, {
      id: saved.id,
      guestName: saved.guestName,
      email: saved.email,
      phone: saved.phone,
      checkOut: saved.checkOut,
      extraData: saved.extraData,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, reservation: saved });
  } catch {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
