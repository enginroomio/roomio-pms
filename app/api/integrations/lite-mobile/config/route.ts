import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadLiteMobileConfig, saveLiteMobileConfig } from '@/lib/integrations/lite-mobile/client';
import type { LiteMobileConfig } from '@/lib/integrations/lite-mobile/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadLiteMobileConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveLiteMobileConfig((await req.json()) as LiteMobileConfig);
  return NextResponse.json({ ok: true });
}
