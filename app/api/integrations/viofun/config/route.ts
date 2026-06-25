import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadViofunConfig,
  saveViofunConfig,
  testViofunConnection,
  listViofunBookings,
} from '@/lib/integrations/viofun/client';
import type { ViofunConfig } from '@/lib/integrations/viofun/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('bookings') === '1') {
    return NextResponse.json({ ok: true, bookings: await listViofunBookings() });
  }

  return NextResponse.json(await loadViofunConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadViofunConfig();
    return NextResponse.json(await testViofunConnection(config));
  }

  await saveViofunConfig((await req.json()) as ViofunConfig);
  return NextResponse.json({ ok: true });
}
