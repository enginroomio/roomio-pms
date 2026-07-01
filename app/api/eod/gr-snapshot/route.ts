import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import {
  getEodGrSnapshotText,
  hasEodGrSnapshots,
  listEodGrSnapshotMeta,
} from '@/lib/server/eod-gr-snapshot';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const businessDate = searchParams.get('businessDate');
  const reportId = searchParams.get('rpr');

  if (!businessDate) {
    return NextResponse.json({ error: 'businessDate required' }, { status: 400 });
  }

  try {
    if (reportId) {
      const text = await getEodGrSnapshotText(businessDate, reportId, propertyId);
      if (!text) {
        return NextResponse.json({ ok: false, found: false, businessDate, reportId }, { status: 404 });
      }
      const format = searchParams.get('format');
      if (format === 'txt') {
        return new NextResponse(text, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${reportId}-${businessDate}-archive.txt"`,
          },
        });
      }
      return NextResponse.json({ ok: true, found: true, businessDate, reportId, text });
    }

    const [exists, reports] = await Promise.all([
      hasEodGrSnapshots(businessDate, propertyId),
      listEodGrSnapshotMeta(businessDate, propertyId),
    ]);
    return NextResponse.json({
      ok: true,
      businessDate,
      found: exists,
      reportCount: reports.length,
      reports,
    });
  } catch (err) {
    logApiError('GET /api/eod/gr-snapshot', err, { propertyId, businessDate, reportId });
    return NextResponse.json({ error: 'snapshot fetch failed' }, { status: 500 });
  }
}
