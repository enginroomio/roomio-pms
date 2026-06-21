import { NextResponse } from 'next/server';
import { loadPbxConfig, testPbxConnection } from '@/lib/integrations/pbx/client';

export const dynamic = 'force-dynamic';

export async function GET() {
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
