import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadIdReaderConfig,
  saveIdReaderConfig,
  testIdReaderConnection,
} from '@/lib/integrations/id-reader/client';
import type { IdReaderConfig } from '@/lib/integrations/id-reader/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadIdReaderConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadIdReaderConfig();
    return NextResponse.json(await testIdReaderConnection(config));
  }

  await saveIdReaderConfig((await req.json()) as IdReaderConfig);
  return NextResponse.json({ ok: true });
}
