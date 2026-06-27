import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getMealPricesServer, saveMealPriceServer } from '@/lib/server/meal-prices';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const prices = await getMealPricesServer(propertyId);
    return NextResponse.json({ ok: true, prices });
  } catch (err) {
    logApiError('GET /api/meal-prices', err);
    return NextResponse.json({ error: 'meal prices fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    mealPlan?: string;
    roomType?: string;
    adultPrice?: number;
    childPrice?: number;
    seasonName?: string;
    currency?: string;
  };
  if (!body.mealPlan || !body.roomType || !body.seasonName || body.adultPrice == null || body.childPrice == null) {
    return NextResponse.json({ error: 'mealPlan, roomType, seasonName, adultPrice, childPrice gerekli' }, { status: 400 });
  }
  try {
    const price = await saveMealPriceServer({
      mealPlan: body.mealPlan,
      roomType: body.roomType,
      adultPrice: body.adultPrice,
      childPrice: body.childPrice,
      seasonName: body.seasonName,
      currency: body.currency,
    }, propertyId);
    return NextResponse.json({ ok: true, price });
  } catch (err) {
    logApiError('POST /api/meal-prices', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
