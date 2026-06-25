import { NextResponse } from 'next/server';
import { getPublicRestaurantCatalog } from '@/lib/integrations/restaurant-booking/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getPublicRestaurantCatalog());
}
