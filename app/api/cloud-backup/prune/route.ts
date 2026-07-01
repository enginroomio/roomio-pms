import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadCloudBackupConfig } from '@/lib/server/cloud-backup/config';
import { pruneRemoteBackups } from '@/lib/server/cloud-backup/retention';
import type { CloudBackupConfig } from '@/lib/integrations/cloud-backup/types';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<CloudBackupConfig>;
    const cfg = Object.keys(body).length > 0
      ? { ...(await loadCloudBackupConfig()), ...body }
      : await loadCloudBackupConfig();
    const result = await pruneRemoteBackups(cfg);
    return NextResponse.json(result);
  } catch (err) {
    logApiError('POST /api/cloud-backup/prune', err);
    return NextResponse.json({ error: 'prune failed' }, { status: 500 });
  }
}
