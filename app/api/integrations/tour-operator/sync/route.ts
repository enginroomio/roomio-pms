import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { syncTourOperatorManifests } from '@/lib/integrations/tour-operator/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await syncTourOperatorManifests());
}
