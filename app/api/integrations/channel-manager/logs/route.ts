import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { listChannelSyncLogs } from '@/lib/integrations/channel-manager/sync-log';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const logs = await listChannelSyncLogs(Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({ count: logs.length, logs });
}
