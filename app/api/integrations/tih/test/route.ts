import { NextResponse } from 'next/server';
import { requireIntegrationIdentityRead } from '@/lib/auth/require-permission';
import { testTihConnection } from '@/lib/integrations/tih/client';

export async function GET(req: Request) {
  const auth = await requireIntegrationIdentityRead(req);
  if (auth instanceof NextResponse) return auth;

  const connection = await testTihConnection();
  return NextResponse.json({ ok: connection.ok, connection });
}
