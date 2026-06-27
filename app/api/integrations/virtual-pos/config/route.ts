import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadVirtualPosConfig, saveVirtualPosConfig, testVirtualPosConnection } from '@/lib/integrations/virtual-pos/client';
import type { VirtualPosConfig } from '@/lib/integrations/virtual-pos/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadVirtualPosConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadVirtualPosConfig();
    return NextResponse.json(await testVirtualPosConnection(config));
  }

  await saveVirtualPosConfig((await req.json()) as VirtualPosConfig);
  return NextResponse.json({ ok: true });
}
