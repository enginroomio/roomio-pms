import { NextResponse } from 'next/server';
import { getAllReservationsServer, addReservationServer } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { Reservation } from '@/lib/types/reservation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const rows = await getAllReservationsServer(propertyId);
  return NextResponse.json({ ok: true, reservations: rows, count: rows.length });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as Reservation;
    if (!body.guestName || !body.checkIn || !body.checkOut) {
      return NextResponse.json({ error: 'guestName, checkIn, checkOut required' }, { status: 400 });
    }
    const saved = await addReservationServer({
      ...body,
      id: body.id || `srv-${Date.now()}`,
      createdAt: body.createdAt || new Date().toISOString().slice(0, 10),
      currency: body.currency ?? 'TRY',
      status: body.status ?? 'CONFIRMED',
    }, propertyId);
    return NextResponse.json({ ok: true, reservation: saved });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
