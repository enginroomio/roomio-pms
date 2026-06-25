import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadGoogleBackupConfig,
  saveGoogleBackupConfig,
  testGoogleBackupConnection,
} from '@/lib/integrations/google-backup/client';
import type { GoogleBackupConfig } from '@/lib/integrations/google-backup/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadGoogleBackupConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const config = await loadGoogleBackupConfig();
    return NextResponse.json(await testGoogleBackupConnection(config));
  }

  await saveGoogleBackupConfig((await req.json()) as GoogleBackupConfig);
  return NextResponse.json({ ok: true });
}
