import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadGoogleBackupConfig, runGoogleBackup } from '@/lib/integrations/google-backup/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const config = await loadGoogleBackupConfig();
  return NextResponse.json(await runGoogleBackup(config));
}
