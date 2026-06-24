import { NextResponse } from 'next/server';
import { requireIntegrationIdentityRead } from '@/lib/auth/require-permission';
import { testEgmConnection } from '@/lib/integrations/egm/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await requireIntegrationIdentityRead(req);
  if (auth instanceof NextResponse) return auth;

  const result = await testEgmConnection();
  return NextResponse.json({ ok: true, connection: result });
}
