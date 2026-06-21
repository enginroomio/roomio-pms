import { NextResponse } from 'next/server';
import type { ExchangeConfig } from '@/lib/exchange/config';
import { getExchangeConfig, saveExchangeConfig } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const config = await getExchangeConfig(propertyId);
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as { config?: ExchangeConfig };
    if (body.config == null || typeof body.config.exchangeDiscountPct !== 'number') {
      return NextResponse.json({ error: 'config.exchangeDiscountPct required' }, { status: 400 });
    }
    const pct = Math.min(50, Math.max(0, body.config.exchangeDiscountPct));
    const saved = await saveExchangeConfig({ exchangeDiscountPct: pct }, propertyId);
    return NextResponse.json({ ok: true, config: saved });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
