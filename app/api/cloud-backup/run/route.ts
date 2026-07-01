import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getBusinessDate } from '@/lib/server/pms-store';
import { runCloudBackup } from '@/lib/server/cloud-backup/service';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json().catch(() => ({}))) as { businessDate?: string };
  const businessDate = body.businessDate ?? (await getBusinessDate(propertyId));

  try {
    const result = await runCloudBackup({
      propertyId,
      businessDate,
      user: auth.user.name,
      trigger: 'manual',
    });
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    logApiError('POST /api/cloud-backup/run', err, { propertyId, businessDate });
    return NextResponse.json({ error: 'backup failed' }, { status: 500 });
  }
}
