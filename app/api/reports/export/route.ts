import { NextResponse } from 'next/server';
import {
  buildCategoryCsv,
  buildCategoryPdf,
  buildReservationCsv,
  buildReservationPdf,
} from '@/lib/server/report-export';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, hasPermission } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = getDemoSession();
  if (!hasPermission(user, 'reports.export')) {
    return NextResponse.json({ error: 'Yetkisiz — reports.export gerekli' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';
  const category = searchParams.get('category');
  const report = searchParams.get('report') ?? 'reservations';

  try {
    if (format === 'csv' || format === 'xlsx') {
      const csv = category
        ? await buildCategoryCsv(category, propertyId)
        : await buildReservationCsv(propertyId);
      const filename = category ? `roomio-${category}.csv` : 'roomio-rezervasyonlar.csv';
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === 'pdf') {
      let pdf: Buffer;
      if (category) {
        pdf = await buildCategoryPdf(category, propertyId);
      } else {
        pdf = await buildReservationPdf(propertyId);
      }
      const filename = category ? `roomio-${category}.pdf` : `roomio-${report}.pdf`;
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'format must be csv or pdf' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
