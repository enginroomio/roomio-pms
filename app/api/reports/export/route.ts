import { NextResponse } from 'next/server';
import {
  buildCategoryCsv,
  buildCategoryPdf,
  buildReservationCsv,
  buildReservationPdf,
} from '@/lib/server/report-export';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { hasPermission } from '@/lib/auth/roles';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { requestPropertyDenied } from '@/lib/auth/property-access';
import { logApiError } from '@/lib/server/api-error';
import { isComplianceReportCategory } from '@/lib/data/eod';
import { appendAuditLog } from '@/lib/server/audit-log';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(user, 'reports.export')) {
    return NextResponse.json({ error: 'Yetkisiz — reports.export gerekli' }, { status: 403 });
  }
  if (requestPropertyDenied(user, req)) {
    return NextResponse.json({ error: 'Bu şubeye erişim yetkiniz yok' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';
  const category = searchParams.get('category');
  const report = searchParams.get('report') ?? 'reservations';

  // TGA/TİS: resmi mevzuat raporları — mevzuata uygun gönderim öncesi sadece
  // sistem yöneticisi görüntüleyebilir/dışa aktarabilir; tüm erişimler korumalı
  // saklama (audit) altına alınır (bkz. lib/data/eod.ts isComplianceReportCategory).
  if (isComplianceReportCategory(category) && !hasPermission(user, 'settings.admin')) {
    return NextResponse.json(
      { error: 'Yetkisiz — TGA/TİS raporları sadece sistem yöneticisi tarafından görüntülenebilir/dışa aktarılabilir' },
      { status: 403 },
    );
  }
  if (isComplianceReportCategory(category)) {
    // Korumalı saklama: TGA/TİS rapor erişimleri (kim, ne zaman, hangi format) audit log'a yazılır.
    await appendAuditLog(
      {
        module: 'reports',
        action: 'compliance_report_export',
        entityType: 'category_report',
        entityId: `${category}:${report}`,
        user: user.name,
        detail: `${(category ?? '').toUpperCase()} raporu görüntülendi/dışa aktarıldı (${format})`,
      },
      propertyId,
    ).catch(() => undefined);
  }

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
  } catch (err) {
    logApiError('GET /api/reports/export', err);
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
