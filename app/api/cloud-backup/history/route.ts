import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { listCloudBackupHistory } from '@/lib/server/cloud-backup/service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? 20);
  const runs = await listCloudBackupHistory(Number.isFinite(limit) ? limit : 20, propertyId);
  return NextResponse.json({ ok: true, runs });
}
