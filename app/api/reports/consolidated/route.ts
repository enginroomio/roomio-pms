import { NextResponse } from 'next/server';
import { buildConsolidatedCsv, buildConsolidatedReport } from '@/lib/server/report-consolidation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

  const report = await buildConsolidatedReport(businessDate);
  return NextResponse.json({ ok: true, ...report });
}
