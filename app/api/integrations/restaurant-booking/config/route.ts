import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadRestaurantBookingConfig, saveRestaurantBookingConfig } from '@/lib/integrations/restaurant-booking/client';
import type { RestaurantBookingConfig } from '@/lib/integrations/restaurant-booking/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadRestaurantBookingConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveRestaurantBookingConfig((await req.json()) as RestaurantBookingConfig);
  return NextResponse.json({ ok: true });
}
