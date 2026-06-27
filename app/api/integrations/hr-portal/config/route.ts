import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadHrPortalConfig, saveHrPortalConfig, testHrPortalConnection } from '@/lib/integrations/hr-portal/client';
import type { HrPortalConfig } from '@/lib/integrations/hr-portal/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadHrPortalConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadHrPortalConfig();
    return NextResponse.json(await testHrPortalConnection(config));
  }

  await saveHrPortalConfig((await req.json()) as HrPortalConfig);
  return NextResponse.json({ ok: true });
}
