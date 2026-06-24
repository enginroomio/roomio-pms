import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadTesaConfig, saveTesaConfig } from '@/lib/integrations/tesa/client';
import type { TesaConfig } from '@/lib/integrations/tesa/types';

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await loadTesaConfig());
}

export async function POST(req: Request) {
    const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as TesaConfig;
  await saveTesaConfig(body);
  return NextResponse.json({ ok: true });
}
