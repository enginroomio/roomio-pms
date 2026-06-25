import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadKioskConfig, saveKioskConfig } from '@/lib/kiosk/client';
import type { KioskConfig } from '@/lib/kiosk/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadKioskConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveKioskConfig((await req.json()) as KioskConfig);
  return NextResponse.json({ ok: true });
}
