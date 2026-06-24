import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadPbxConfig, testPbxConnection } from '@/lib/integrations/pbx/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const config = await loadPbxConfig();
  const connection = await testPbxConnection(config);
  return NextResponse.json({
    ok: true,
    model: config.model,
    host: config.host,
    port: config.port,
    connection,
  });
}
