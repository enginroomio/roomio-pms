import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { getHotspot5651Stats } from '@/lib/integrations/hotspot5651/server';

export async function GET(req: Request) {
    const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getHotspot5651Stats());
}
