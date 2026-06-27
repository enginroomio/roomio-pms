import { exchangeRateFromTcmb, type ExchangeConfig } from '@/lib/exchange/config';
import type { ExchangeRateRow, ExchangeRateSnapshot } from '@/lib/exchange/types';

export function applyExchangeDiscount(
  rates: ExchangeRateRow[],
  config: ExchangeConfig,
): ExchangeRateRow[] {
  const pct = config.exchangeDiscountPct;
  return rates.map((r) => {
    const tryPerUnitExchange = exchangeRateFromTcmb(r.tryPerUnitBuy, pct);
    return {
      ...r,
      tryPerUnit: r.tryPerUnitBuy,
      tryPerUnitExchange,
    };
  });
}

export function enrichSnapshot(
  snapshot: Omit<ExchangeRateSnapshot, 'exchangeDiscountPct' | 'rates'> & { rates: ExchangeRateRow[] },
  config: ExchangeConfig,
): ExchangeRateSnapshot {
  return {
    ...snapshot,
    exchangeDiscountPct: config.exchangeDiscountPct,
    rates: applyExchangeDiscount(snapshot.rates, config),
  };
}
