import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadGuestPortalConfig, saveGuestPortalConfig } from '@/lib/guest-portal/client';
import type { GuestPortalConfig } from '@/lib/guest-portal/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadGuestPortalConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as GuestPortalConfig;
  await saveGuestPortalConfig(body);
  return NextResponse.json({ ok: true });
}
