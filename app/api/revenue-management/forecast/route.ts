import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getRevenueForecast } from '@/lib/revenue-management/forecast';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reports.export');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const days = Math.min(31, Math.max(7, Number(url.searchParams.get('days') ?? 14)));
  const propertyId = propertyIdFromRequest(req);
  const snapshot = await getRevenueForecast(propertyId, days);
  return NextResponse.json(snapshot);
}
