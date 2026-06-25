import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { scanIdDocument } from '@/lib/integrations/id-reader/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { deviceId?: string };
  return NextResponse.json(await scanIdDocument(body.deviceId));
}
