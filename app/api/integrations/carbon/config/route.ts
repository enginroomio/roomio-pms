import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadCarbonConfig, saveCarbonConfig } from '@/lib/integrations/carbon/client';
import type { CarbonConfig } from '@/lib/integrations/carbon/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadCarbonConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveCarbonConfig((await req.json()) as CarbonConfig);
  return NextResponse.json({ ok: true });
}
