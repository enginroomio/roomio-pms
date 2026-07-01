import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadTisConfig, saveTisConfig } from '@/lib/integrations/tis/client';
import type { TisConfig } from '@/lib/integrations/tis/types';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadTisConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as TisConfig;
  await saveTisConfig(body);
  return NextResponse.json({ ok: true });
}
