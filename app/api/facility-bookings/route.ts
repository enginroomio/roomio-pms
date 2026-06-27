import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  getFacilityBookingsServer,
  saveFacilityBookingServer,
  type FacilityKind,
} from '@/lib/server/facility-bookings';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

const KINDS = new Set<FacilityKind>(['restaurant', 'tennis', 'spa', 'gym']);

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind') as FacilityKind | null;
  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: 'kind=restaurant|tennis|spa|gym gerekli' }, { status: 400 });
  }
  try {
    const bookings = await getFacilityBookingsServer(kind, propertyId);
    return NextResponse.json({ ok: true, kind, bookings });
  } catch (err) {
    logApiError('GET /api/facility-bookings', err);
    return NextResponse.json({ error: 'bookings fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    kind?: FacilityKind;
    guest?: string;
    roomNo?: string;
    date?: string;
    time?: string;
    party?: number;
    notes?: string;
    reservationId?: string;
  };

  if (!body.kind || !KINDS.has(body.kind) || !body.guest || !body.roomNo || !body.time) {
    return NextResponse.json({ error: 'kind, guest, roomNo, time gerekli' }, { status: 400 });
  }

  try {
    const booking = await saveFacilityBookingServer(body.kind, {
      date: body.date ?? new Date().toISOString().slice(0, 10),
      time: body.time,
      guest: body.guest,
      roomNo: body.roomNo,
      party: body.party ?? 2,
      status: 'Bekliyor',
      notes: body.notes,
      reservationId: body.reservationId,
    }, propertyId);
    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    logApiError('POST /api/facility-bookings', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
