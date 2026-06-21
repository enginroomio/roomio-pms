import { NextResponse } from 'next/server';
import { getAllReservationsServer, getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { availabilityMatrix } from '@/lib/server/report-export';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? (await getBusinessDate(propertyId));
  const days = Math.min(31, Math.max(1, Number(searchParams.get('days') ?? 7)));
  const reservations = await getAllReservationsServer(propertyId);
  const matrix = availabilityMatrix(reservations, from, days);
  return NextResponse.json({ ok: true, from, days, matrix });
}
