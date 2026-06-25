import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadGuestAppConfig, saveGuestAppConfig } from '@/lib/integrations/guest-app/client';
import type { GuestAppConfig } from '@/lib/integrations/guest-app/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadGuestAppConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveGuestAppConfig((await req.json()) as GuestAppConfig);
  return NextResponse.json({ ok: true });
}
