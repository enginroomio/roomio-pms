import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadEdispatchConfig,
  saveEdispatchConfig,
  testEdispatchConnection,
} from '@/lib/integrations/e-dispatch/client';
import type { EdispatchConfig } from '@/lib/integrations/e-dispatch/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadEdispatchConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadEdispatchConfig();
    return NextResponse.json(await testEdispatchConnection(config));
  }

  await saveEdispatchConfig((await req.json()) as EdispatchConfig);
  return NextResponse.json({ ok: true });
}
