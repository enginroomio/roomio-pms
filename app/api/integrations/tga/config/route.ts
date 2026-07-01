import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadTgaConfig, saveTgaConfig } from '@/lib/integrations/tga/client';
import type { TgaConfig } from '@/lib/integrations/tga/types';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadTgaConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as TgaConfig;
  await saveTgaConfig(body);
  return NextResponse.json({ ok: true });
}
