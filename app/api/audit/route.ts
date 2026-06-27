import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { getAuditLogsServer } from '@/lib/server/audit-log';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';
import { buildNightAuditPdfKit } from '@/lib/server/pdf-templates';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['eod.close', 'reports.export', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const businessDate = searchParams.get('businessDate') ?? undefined;
  const module = searchParams.get('module') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '200');
  const format = searchParams.get('format');

  try {
    const logs = await getAuditLogsServer(propertyId, {
      businessDate,
      module,
      limit: Number.isFinite(limit) ? limit : 200,
    });

    if (format === 'pdf') {
      if (!businessDate) {
        return NextResponse.json({ error: 'businessDate required for pdf' }, { status: 400 });
      }
      await init();
      const hotel = (await getProperty(propertyId))?.name ?? 'Hotel';
      const pdf = await buildNightAuditPdfKit({
        hotel,
        businessDate,
        generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        logs,
      });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="night-audit-${businessDate}.pdf"`,
        },
      });
    }

    return NextResponse.json({ ok: true, businessDate, logs });
  } catch (err) {
    logApiError('GET /api/audit', err);
    return NextResponse.json({ error: 'audit fetch failed' }, { status: 500 });
  }
}
