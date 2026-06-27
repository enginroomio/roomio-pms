import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadQualityConfig, saveQualityConfig } from '@/lib/integrations/quality/client';
import type { QualityConfig } from '@/lib/integrations/quality/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadQualityConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveQualityConfig((await req.json()) as QualityConfig);
  return NextResponse.json({ ok: true });
}
