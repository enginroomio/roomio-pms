import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { loadElektraServerConfig, testElektraServerConnection } from '@/lib/integrations/elektra-server/client';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const config = await loadElektraServerConfig();
  const connection = await testElektraServerConnection(config);
  return NextResponse.json({ ok: connection.ok, connection });
}
