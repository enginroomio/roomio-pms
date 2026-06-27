import { NextResponse } from 'next/server';
import { getPublicHrPortalInfo } from '@/lib/integrations/hr-portal/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicHrPortalInfo());
}
