import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { isMarketRequiredServer } from '@/lib/server/user-params';
import { saveConfigParamServer } from '@/lib/server/config-params';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const required = await isMarketRequiredServer(propertyId);
    return NextResponse.json({ ok: true, required });
  } catch (err) {
    logApiError('GET /api/market-required', err);
    return NextResponse.json({ error: 'market required fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { required?: boolean };
  if (body.required == null) {
    return NextResponse.json({ error: 'required gerekli' }, { status: 400 });
  }
  try {
    await saveConfigParamServer({
      key: 'MARKET_REQUIRED',
      value: body.required ? 'Evet' : 'Hayır',
      description: 'Rezervasyonda market zorunlu',
    }, propertyId);
    return NextResponse.json({ ok: true, required: body.required });
  } catch (err) {
    logApiError('POST /api/market-required', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
