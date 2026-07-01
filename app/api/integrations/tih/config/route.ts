import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite, requireIntegrationIdentityRead } from '@/lib/auth/require-permission';
import { loadTihConfig, saveTihConfig } from '@/lib/integrations/tih/client';
import type { TihConfig } from '@/lib/integrations/tih/types';

export async function GET(req: Request) {
  const auth = await requireIntegrationIdentityRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadTihConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as TihConfig;
  await saveTihConfig(body);
  return NextResponse.json({ ok: true });
}
