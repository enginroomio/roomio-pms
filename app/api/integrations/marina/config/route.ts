import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadMarinaConfig,
  saveMarinaConfig,
  testMarinaConnection,
  listMarinaBookings,
} from '@/lib/integrations/marina/client';
import type { MarinaConfig } from '@/lib/integrations/marina/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('bookings') === '1') {
    return NextResponse.json({ ok: true, bookings: await listMarinaBookings() });
  }

  return NextResponse.json(await loadMarinaConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadMarinaConfig();
    return NextResponse.json(await testMarinaConnection(config));
  }

  await saveMarinaConfig((await req.json()) as MarinaConfig);
  return NextResponse.json({ ok: true });
}
