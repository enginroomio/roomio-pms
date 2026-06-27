import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadReputationConfig, saveReputationConfig } from '@/lib/integrations/reputation/client';
import type { ReputationConfig } from '@/lib/integrations/reputation/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadReputationConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveReputationConfig((await req.json()) as ReputationConfig);
  return NextResponse.json({ ok: true });
}
