import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getExtraChargesServer, saveExtraChargeServer } from '@/lib/server/extra-charges';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const charges = await getExtraChargesServer(propertyId);
    return NextResponse.json({ ok: true, charges });
  } catch (err) {
    logApiError('GET /api/extra-charges', err);
    return NextResponse.json({ error: 'extra charges fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    price?: number;
    priceUnit?: string;
    currency?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || body.price == null) {
    return NextResponse.json({ error: 'code, name, price gerekli' }, { status: 400 });
  }
  try {
    const charge = await saveExtraChargeServer({
      code: body.code,
      name: body.name,
      price: body.price,
      priceUnit: body.priceUnit,
      currency: body.currency,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, charge });
  } catch (err) {
    logApiError('POST /api/extra-charges', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
