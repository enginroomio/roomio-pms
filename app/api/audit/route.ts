import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { getAuditLogsServer } from '@/lib/server/audit-log';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';
import { buildNightAuditPdfKit } from '@/lib/server/pdf-templates';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['eod.close', 'reports.export']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const businessDate = searchParams.get('businessDate') ?? (await getBusinessDate(propertyId));
  const module = searchParams.get('module') ?? undefined;
  const format = searchParams.get('format');

  try {
    const logs = await getAuditLogsServer(propertyId, { businessDate, module });

    if (format === 'pdf') {
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
  } catch {
    return NextResponse.json({ error: 'audit fetch failed' }, { status: 500 });
  }
}
