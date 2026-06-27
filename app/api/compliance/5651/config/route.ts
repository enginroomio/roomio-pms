import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadHotspot5651Config, saveHotspot5651Config } from '@/lib/integrations/hotspot5651/server';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await loadHotspot5651Config());
}

export async function POST(req: Request) {
    const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as Hotspot5651Config;
  await saveHotspot5651Config(body);
  return NextResponse.json({ ok: true });
}
