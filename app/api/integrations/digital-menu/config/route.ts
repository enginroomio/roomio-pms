import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadDigitalMenuConfig, saveDigitalMenuConfig } from '@/lib/integrations/digital-menu/client';
import type { DigitalMenuConfig } from '@/lib/integrations/digital-menu/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadDigitalMenuConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveDigitalMenuConfig((await req.json()) as DigitalMenuConfig);
  return NextResponse.json({ ok: true });
}
