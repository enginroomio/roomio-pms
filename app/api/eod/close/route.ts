import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { closeBusinessDay, getBusinessDate, getEodArchiveServer } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { buildEodPdf } from '@/lib/server/report-export';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const [businessDate, archive] = await Promise.all([getBusinessDate(propertyId), getEodArchiveServer(propertyId)]);
  return NextResponse.json({ ok: true, businessDate, archive });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as { closedBy?: string };
    const result = await closeBusinessDay(body.closedBy ?? user.name, propertyId);
    const pdf = await buildEodPdf(
      result.archive.businessDate,
      result.archive.occupancy,
      result.archive.revenue,
      body.closedBy ?? user.name,
    );
    return NextResponse.json({
      ok: true,
      archive: result.archive,
      newBusinessDate: result.newDate,
      archivedReports: result.archivedReports,
      cloudBackup: result.cloudBackup ?? null,
      pdfBase64: pdf.toString('base64'),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'close failed' }, { status: 500 });
  }
}
