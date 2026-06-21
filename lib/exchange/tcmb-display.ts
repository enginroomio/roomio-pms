import type { ExchangeRateRow } from '@/lib/exchange/types';

/** TCMB'nin yayınladığı birim alış (JPY 100 → ~28,62 TRY) */
export function tcmbPublishedBuy(row: ExchangeRateRow): number {
  return row.tryPerUnitBuy * row.unit;
}

/** TCMB birim alışına kur bozdurma indirimi uygulanmış hali */
export function tcmbPublishedExchange(row: ExchangeRateRow): number {
  return row.tryPerUnitExchange * row.unit;
}

/** Elektra alt çubuk etiketi — JPY 100, USD 1 */
export function tcmbUnitLabel(code: string, unit: number): string {
  return unit === 1 ? `${code} 1` : `${code} ${unit}`;
}

export function formatTcmbRate(value: number, code?: string): string {
  const digits = code === 'JPY' ? 2 : 4;
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
