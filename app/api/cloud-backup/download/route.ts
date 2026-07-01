import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { resolveCloudBackupDownload } from '@/lib/server/cloud-backup/service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ error: 'runId required' }, { status: 400 });
  }

  const propertyId = propertyIdFromRequest(req);
  const resolved = await resolveCloudBackupDownload(runId, propertyId);
  if (!resolved) {
    return NextResponse.json({ error: 'backup not found' }, { status: 404 });
  }

  const stat = fs.statSync(resolved.path);
  const stream = Readable.toWeb(fs.createReadStream(resolved.path)) as ReadableStream;
  const ext = path.extname(resolved.fileName);
  const mime = ext === '.gz' ? 'application/gzip' : 'application/octet-stream';

  return new NextResponse(stream, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${resolved.fileName}"`,
      'Content-Length': String(stat.size),
    },
  });
}
