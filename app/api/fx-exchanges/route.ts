import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getFxExchangesServer, postFxExchangeServer } from '@/lib/server/fx-exchanges';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getBusinessDate } from '@/lib/server/pms-store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'cash.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const businessDate = searchParams.get('businessDate') ?? undefined;

  try {
    const exchanges = await getFxExchangesServer(propertyId, businessDate ?? undefined);
    const date = businessDate ?? await getBusinessDate(propertyId);
    return NextResponse.json({ ok: true, businessDate: date, exchanges });
  } catch {
    return NextResponse.json({ error: 'fx fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'cash.write');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    guest?: string;
    roomNo?: string;
    reservationId?: string;
    fromCurrency?: 'EUR' | 'USD' | 'GBP';
    fromAmount?: number;
    user?: string;
    register?: string;
  };

  if (!body.guest || !body.roomNo || !body.fromCurrency || body.fromAmount == null) {
    return NextResponse.json({ error: 'guest, roomNo, fromCurrency, fromAmount gerekli' }, { status: 400 });
  }
  if (!Number.isFinite(body.fromAmount) || body.fromAmount <= 0) {
    return NextResponse.json({ error: 'Geçerli tutar girin' }, { status: 400 });
  }

  try {
    const exchange = await postFxExchangeServer({
      guest: body.guest,
      roomNo: body.roomNo,
      reservationId: body.reservationId,
      fromCurrency: body.fromCurrency,
      fromAmount: body.fromAmount,
      user: body.user,
      register: body.register,
    }, propertyId);
    return NextResponse.json({ ok: true, exchange });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fx post failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
