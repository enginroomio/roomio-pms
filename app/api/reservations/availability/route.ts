import { NextResponse } from 'next/server';
import { getAllReservationsServer, getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { availabilityMatrix } from '@/lib/server/report-export';
import {
  filterReservations,
  graphicFilterImpact,
  type GraphicFilterRule,
} from '@/lib/reservations/graphic-filters';

export const dynamic = 'force-dynamic';

function parseFilters(raw: string | null): GraphicFilterRule[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as GraphicFilterRule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? (await getBusinessDate(propertyId));
  const days = Math.min(31, Math.max(1, Number(searchParams.get('days') ?? 7)));
  const rules = parseFilters(searchParams.get('filters'));
  const allReservations = await getAllReservationsServer(propertyId);
  const filtered = filterReservations(allReservations, rules);
  const matrix = availabilityMatrix(filtered, from, days);
  const baseMatrix = rules.length > 0 ? availabilityMatrix(allReservations, from, days) : undefined;

  return NextResponse.json({
    ok: true,
    from,
    days,
    matrix,
    baseMatrix,
    filterCount: rules.length,
    matchedReservations: filtered.length,
    totalReservations: allReservations.length,
    impact: graphicFilterImpact(matrix),
    baseImpact: baseMatrix ? graphicFilterImpact(baseMatrix) : graphicFilterImpact(matrix),
  });
}
