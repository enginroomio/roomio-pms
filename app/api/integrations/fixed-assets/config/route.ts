import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadFixedAssetsConfig, saveFixedAssetsConfig } from '@/lib/integrations/fixed-assets/client';
import type { FixedAssetsConfig } from '@/lib/integrations/fixed-assets/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadFixedAssetsConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveFixedAssetsConfig((await req.json()) as FixedAssetsConfig);
  return NextResponse.json({ ok: true });
}
