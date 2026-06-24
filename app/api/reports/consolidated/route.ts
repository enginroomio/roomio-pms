import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { buildConsolidatedCsv, buildConsolidatedPdf, buildConsolidatedReport } from '@/lib/server/report-consolidation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reports.export');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const format = url.searchParams.get('format');
  const businessDate = url.searchParams.get('businessDate') ?? undefined;

  if (format === 'csv') {
    const csv = await buildConsolidatedCsv();
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="roomio-consolidated.csv"',
      },
    });
  }

  if (format === 'pdf') {
    const pdf = await buildConsolidatedPdf(businessDate);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="roomio-consolidated.pdf"',
      },
    });
  }

  const report = await buildConsolidatedReport(businessDate);
  return NextResponse.json({ ok: true, ...report });
}
