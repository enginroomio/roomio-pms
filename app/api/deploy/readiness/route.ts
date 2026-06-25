import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { getProductionReadiness } from '@/lib/deploy/readiness';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['settings.admin', 'reports.export']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const readiness = await getProductionReadiness(propertyId);
  return NextResponse.json(readiness);
}
