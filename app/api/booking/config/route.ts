import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadBookingEngineConfig, saveBookingEngineConfig } from '@/lib/booking-engine/client';
import type { BookingEngineConfig } from '@/lib/booking-engine/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadBookingEngineConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as BookingEngineConfig;
  await saveBookingEngineConfig(body);
  return NextResponse.json({ ok: true });
}
