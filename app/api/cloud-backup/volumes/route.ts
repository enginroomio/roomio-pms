import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { listMountedVolumes } from '@/lib/server/cloud-backup/paths';

export const dynamic = 'force-dynamic';

/** macOS'ta takılı harici diskleri listeler (SanDisk vb.) */
export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  const volumes = await listMountedVolumes();
  return NextResponse.json({ volumes, platform: process.platform });
}
