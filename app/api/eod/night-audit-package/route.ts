import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { parseNightAuditSnapshot } from '@/lib/server/eod-archive-package';
import { nightAuditSnapshotDisplayText } from '@/lib/reports/night-audit-text';
import { getEodGrSnapshotText } from '@/lib/server/eod-gr-snapshot';
import { buildNightAuditPackageForDate } from '@/lib/server/night-audit-package';
import { buildNightAuditPackagePdfKit } from '@/lib/server/pdf-templates';
import { queueAndDeliverEmailServer } from '@/lib/server/email-outbox';
import { getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

async function loadNightAuditPackage(propertyId: string, businessDate: string) {
  const snapshot = await getEodGrSnapshotText(businessDate, 'NIGHT-AUDIT', propertyId);
  if (snapshot) {
    const archived = parseNightAuditSnapshot(snapshot);
    if (archived) return { pkg: archived, source: 'archive' as const };
  }
  const pkg = await buildNightAuditPackageForDate(propertyId, businessDate);
  return { pkg, source: 'live' as const };
}

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const businessDate = searchParams.get('businessDate') ?? (await getBusinessDate(propertyId));

  try {
    const { pkg, source } = await loadNightAuditPackage(propertyId, businessDate);

    if (format === 'pdf') {
      const pdf = await buildNightAuditPackagePdfKit(pkg, propertyId);
      const suffix = source === 'archive' ? '-archive' : '';
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="night-audit-package-${pkg.businessDate}${suffix}.pdf"`,
        },
      });
    }

    if (format === 'txt') {
      const snapshot = await getEodGrSnapshotText(businessDate, 'NIGHT-AUDIT', propertyId);
      const text = snapshot ? nightAuditSnapshotDisplayText(snapshot) : nightAuditSnapshotDisplayText(JSON.stringify(pkg));
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="night-audit-package-${pkg.businessDate}.txt"`,
        },
      });
    }

    return NextResponse.json({ ok: true, package: pkg, source });
  } catch (err) {
    logApiError('GET /api/eod/night-audit-package', err, { propertyId });
    return NextResponse.json({ error: 'package fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { user?: string; email?: string; businessDate?: string };
  const businessDate = body.businessDate ?? (await getBusinessDate(propertyId));
  try {
    const { pkg } = await loadNightAuditPackage(propertyId, businessDate);
    const email = body.email ?? 'muhasebe@hotelsapphire.com';
    const mail = await queueAndDeliverEmailServer({
      to: email,
      subject: `Gece Denetim Paketi — ${pkg.hotel} · ${businessDate}`,
      body: [
        `Otel: ${pkg.hotel}`,
        `İş günü: ${businessDate}`,
        `Hazır: ${pkg.ready ? 'Evet' : 'Hayır'}`,
        `Ön kontrol: ${pkg.checks.length} madde`,
        `Denetim kaydı: ${pkg.auditLogs.length} satır`,
        '',
        'PDF ekini indirmek için PMS → Raporlar → Gece Denetim.',
      ].join('\n'),
      attachment: `night-audit-package-${businessDate}.pdf`,
      user: body.user ?? user.name,
    }, propertyId);

    return NextResponse.json({
      ok: true,
      sent: mail.status === 'sent',
      queued: mail.status === 'queued',
      email,
      mailId: mail.id,
      mailStatus: mail.status,
      mailError: mail.error,
      ready: pkg.ready,
      checkCount: pkg.checks.length,
      logCount: pkg.auditLogs.length,
    });
  } catch (err) {
    logApiError('POST /api/eod/night-audit-package', err, { propertyId });
    return NextResponse.json({ error: 'notify failed' }, { status: 500 });
  }
}
