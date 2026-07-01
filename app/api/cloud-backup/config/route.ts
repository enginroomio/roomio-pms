import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadCloudBackupConfig, saveCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { testCloudBackupConnection } from '@/lib/server/cloud-backup/service';
import type { CloudBackupConfig } from '@/lib/integrations/cloud-backup/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadCloudBackupConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('test') === '1') {
    const body = (await req.json().catch(() => ({}))) as Partial<CloudBackupConfig>;
    const config = { ...(await loadCloudBackupConfig()), ...body, enabled: true };
    return NextResponse.json(await testCloudBackupConnection(config));
  }

  const body = (await req.json()) as CloudBackupConfig;
  await saveCloudBackupConfig(body);
  return NextResponse.json({ ok: true });
}
