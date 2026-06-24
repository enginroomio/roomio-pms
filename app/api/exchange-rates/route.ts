import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { getExchangeRatesSnapshot } from '@/lib/server/exchange-rates-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { TcmbRateError } from '@/lib/server/tcmb-rates';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const refresh = url.searchParams.get('refresh') === '1';
  const date = url.searchParams.get('date') ?? undefined;
  const debug = url.searchParams.get('debug') === '1';
  const propertyId = propertyIdFromRequest(req);

  try {
    const snapshot = await getExchangeRatesSnapshot(propertyId, { force: refresh, date, debug });
    return NextResponse.json(snapshot);
  } catch (e) {
    const message = e instanceof TcmbRateError ? e.message : 'TCMB kurları alınamadı';
    return NextResponse.json({ ok: false, origin: 'none', error: message }, { status: 503 });
  }
}
