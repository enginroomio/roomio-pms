import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { syncReputationReviews } from '@/lib/integrations/reputation/client';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const propertyId = propertyIdFromRequest(req);
  return NextResponse.json(await syncReputationReviews(propertyId));
}
