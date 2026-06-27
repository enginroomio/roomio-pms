import { NextResponse } from 'next/server';
import { getPublicInventorySummary } from '@/lib/integrations/inventory/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicInventorySummary());
}
