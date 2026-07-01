import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { appendAuditLog } from '@/lib/server/audit-log';
import { ensureDailyEodArchive, saveDailyEodArchive } from '@/lib/server/eod-daily-archive';
import { getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json().catch(() => ({}))) as {
    businessDate?: string;
    ensureOnly?: boolean;
  };
  const businessDate = body.businessDate ?? (await getBusinessDate(propertyId));

  try {
    const result = body.ensureOnly
      ? await ensureDailyEodArchive(user.name, propertyId)
      : await saveDailyEodArchive(businessDate, user.name, propertyId);

    if (!result) {
      return NextResponse.json({
        ok: true,
        businessDate,
        skipped: true,
        message: 'Günlük arşiv zaten mevcut',
      });
    }

    await appendAuditLog(
      {
        module: 'eod',
        action: 'daily_eod_archived',
        entityType: 'EodArchive',
        entityId: result.archiveId,
        user: user.name,
        detail: `${result.grCount} GR + ekler DB'ye kaydedildi (toplam ${result.totalCount})`,
        businessDate,
      },
      propertyId,
    );

    return NextResponse.json({
      ok: true,
      businessDate: result.businessDate,
      archiveId: result.archiveId,
      status: result.status,
      grCount: result.grCount,
      totalCount: result.totalCount,
      generatedAt: result.manifest.generatedAt,
    });
  } catch (err) {
    logApiError('POST /api/eod/daily-archive', err, { propertyId, businessDate });
    return NextResponse.json({ error: 'daily archive failed' }, { status: 500 });
  }
}
