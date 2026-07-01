import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { appendAuditLog } from '@/lib/server/audit-log';
import { buildLegacyRenderContextServer } from '@/lib/server/eod-legacy-context';
import { getEodGrSnapshotText, hasEodGrSnapshots, listEodGrSnapshotMeta } from '@/lib/server/eod-gr-snapshot';
import { getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';
import { EOD_LEGACY_REPORTS, findLegacyReport } from '@/lib/reports/eod-legacy-catalog';
import {
  buildEodLegacyPackage,
  buildEodLegacyPackageTextBundle,
} from '@/lib/reports/eod-legacy-package';
import { renderLegacyEodReport } from '@/lib/reports/eod-legacy-render';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const businessDate = searchParams.get('businessDate') ?? (await getBusinessDate(propertyId));
  const reportId = searchParams.get('rpr');
  const format = searchParams.get('format');

  try {
    const archived = await hasEodGrSnapshots(businessDate, propertyId);

    if (reportId) {
      const snapshotText = await getEodGrSnapshotText(businessDate, reportId, propertyId);
      if (snapshotText) {
        if (format === 'txt') {
          return new NextResponse(snapshotText, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Content-Disposition': `attachment; filename="${reportId}-${businessDate}-archive.txt"`,
            },
          });
        }
        return NextResponse.json({ ok: true, reportId, businessDate, text: snapshotText, source: 'archive' });
      }

      const report = findLegacyReport(reportId);
      if (!report) {
        return NextResponse.json({ error: 'unknown report' }, { status: 404 });
      }
      const ctx = await buildLegacyRenderContextServer(propertyId, businessDate, auth.user.name);
      const text = renderLegacyEodReport(report, ctx);
      if (format === 'txt') {
        return new NextResponse(text, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${reportId}-${businessDate}.txt"`,
          },
        });
      }
      return NextResponse.json({ ok: true, reportId, businessDate, text });
    }

    if (archived) {
      const metas = await listEodGrSnapshotMeta(businessDate, propertyId);
      if (format === 'txt') {
        const parts: string[] = [];
        for (const meta of metas) {
          const text = await getEodGrSnapshotText(businessDate, meta.reportId, propertyId);
          const title = findLegacyReport(meta.reportId)?.title ?? meta.reportId;
          parts.push(`=== ${meta.reportId} — ${title} ===\n${text ?? ''}`);
        }
        const bundle = parts.join('\n\n');
        return new NextResponse(bundle, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="gr-package-${businessDate}-archive.txt"`,
          },
        });
      }
      return NextResponse.json({
        ok: true,
        businessDate,
        source: 'archive',
        reportCount: metas.length,
        reports: metas.map((meta) => ({
          id: meta.reportId,
          title: findLegacyReport(meta.reportId)?.title ?? meta.reportId,
          businessDate: meta.businessDate,
          generatedAt: meta.generatedAt,
          status: 'ready' as const,
          lineCount: meta.lineCount,
        })),
      });
    }

    const ctx = await buildLegacyRenderContextServer(propertyId, businessDate, auth.user.name);

    const pkg = buildEodLegacyPackage(ctx);
    if (format === 'txt') {
      const bundle = buildEodLegacyPackageTextBundle(pkg);
      return new NextResponse(bundle, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="gr-package-${businessDate}.txt"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      businessDate: pkg.businessDate,
      generatedAt: pkg.generatedAt,
      reportCount: pkg.reportCount,
      reports: pkg.reports,
    });
  } catch (err) {
    logApiError('GET /api/eod/gr-package', err, { propertyId, businessDate, reportId });
    return NextResponse.json({ error: 'package fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json().catch(() => ({}))) as { businessDate?: string; persist?: boolean };
  const businessDate = body.businessDate ?? (await getBusinessDate(propertyId));
  const persist = body.persist !== false;

  try {
    const ctx = await buildLegacyRenderContextServer(propertyId, businessDate, user.name);
    const pkg = buildEodLegacyPackage(ctx);

    let archived: { grCount: number; totalCount: number; archiveId: string } | undefined;
    let cloudBackup: import('@/lib/integrations/cloud-backup/types').CloudBackupResult | null | undefined;
    if (persist) {
      const { saveDailyEodArchive } = await import('@/lib/server/eod-daily-archive');
      const daily = await saveDailyEodArchive(businessDate, user.name, propertyId);
      archived = {
        grCount: daily.grCount,
        totalCount: daily.totalCount,
        archiveId: daily.archiveId,
      };
      cloudBackup = daily.cloudBackup ?? null;
    }

    await appendAuditLog(
      {
        module: 'eod',
        action: 'gr_package_generated',
        entityType: 'EodPackage',
        entityId: businessDate,
        user: user.name,
        detail: `${pkg.reportCount} GR raporu üretildi`,
        businessDate,
      },
      propertyId,
    );

    return NextResponse.json({
      ok: true,
      businessDate: pkg.businessDate,
      generatedAt: pkg.generatedAt,
      reportCount: pkg.reportCount,
      reports: pkg.reports,
      catalogSize: EOD_LEGACY_REPORTS.length,
      archived,
      persisted: Boolean(archived),
      cloudBackup: cloudBackup ?? null,
    });
  } catch (err) {
    logApiError('POST /api/eod/gr-package', err, { propertyId, businessDate });
    return NextResponse.json({ error: 'package generate failed' }, { status: 500 });
  }
}
