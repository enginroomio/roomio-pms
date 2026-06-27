import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadCallCenterConfig, saveCallCenterConfig, testCallCenterStack } from '@/lib/integrations/call-center/client';
import type { CallCenterConfig } from '@/lib/integrations/call-center/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadCallCenterConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadCallCenterConfig();
    return NextResponse.json(await testCallCenterStack(config));
  }

  await saveCallCenterConfig((await req.json()) as CallCenterConfig);
  return NextResponse.json({ ok: true });
}
