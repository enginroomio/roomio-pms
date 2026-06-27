import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getBusinessDate, setBusinessDateServer } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const businessDate = await getBusinessDate(propertyId);
    return NextResponse.json({
      ok: true,
      businessDate,
      systemDate: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    logApiError('GET /api/business-date', err);
    return NextResponse.json({ error: 'business date fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { businessDate?: string; user?: string };
  if (!body.businessDate) {
    return NextResponse.json({ error: 'businessDate gerekli' }, { status: 400 });
  }
  try {
    const result = await setBusinessDateServer(body.businessDate, body.user ?? 'Kuruluş', propertyId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logApiError('POST /api/business-date', err);
    return NextResponse.json({ error: 'business date update failed' }, { status: 500 });
  }
}
