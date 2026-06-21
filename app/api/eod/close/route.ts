import { NextResponse } from 'next/server';
import { closeBusinessDay, getBusinessDate, getEodArchiveServer } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, hasPermission } from '@/lib/auth/roles';
import { buildEodPdf } from '@/lib/server/report-export';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const [businessDate, archive] = await Promise.all([getBusinessDate(propertyId), getEodArchiveServer(propertyId)]);
  return NextResponse.json({ ok: true, businessDate, archive });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = getDemoSession();
  if (!hasPermission(user, 'eod.close')) {
    return NextResponse.json({ error: 'Yetkisiz — eod.close gerekli' }, { status: 403 });
  }

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
      pdfBase64: pdf.toString('base64'),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'close failed' }, { status: 500 });
  }
}
