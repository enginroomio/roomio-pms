import { NextResponse } from 'next/server';
import { getPublicFairCatalog } from '@/lib/integrations/fair-events/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicFairCatalog());
}
