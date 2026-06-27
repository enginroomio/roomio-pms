import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const snapshot = await getDashboardSnapshot(propertyId);
  return NextResponse.json(
    { ok: true, propertyId, ...snapshot },
    {
      headers: {
        'Cache-Control': 'private, max-age=3, stale-while-revalidate=10',
      },
    },
  );
}
