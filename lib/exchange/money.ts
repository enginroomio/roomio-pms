import { CURRENCY_SYMBOLS, type ExchangeRateRow } from '@/lib/exchange/types';

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function formatMoney(amount: number, currency: string = 'TRY'): string {
  if (currency === 'TRY') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
  }
  const sym = currencySymbol(currency);
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
  return `${sym}${formatted}`;
}

/** TCMB alış kurları — tüm hesaplamalar */
export function rateMapFromRows(rates: ExchangeRateRow[]): Map<string, ExchangeRateRow> {
  const map = new Map<string, ExchangeRateRow>();
  map.set('TRY', {
    code: 'TRY',
    name: 'Türk Lirası',
    unit: 1,
    symbol: '₺',
    tryPerUnit: 1,
    tryPerUnitBuy: 1,
    tryPerUnitSell: 1,
    tryPerUnitExchange: 1,
    forexBuying: 1,
    forexSelling: 1,
    banknoteBuying: 1,
    banknoteSelling: 1,
  });
  for (const r of rates) map.set(r.code, { ...r, tryPerUnit: r.tryPerUnitBuy });
  return map;
}

/** TCMB alış ile TL karşılığı (fatura, rezervasyon, muhasebe) */
export function foreignToTry(amount: number, currency: string, rates: Map<string, ExchangeRateRow>): number {
  if (currency === 'TRY') return amount;
  const row = rates.get(currency);
  if (!row?.tryPerUnitBuy) return amount;
  return amount * row.tryPerUnitBuy;
}

/** Kur bozdurma ile TL karşılığı (TCMB alış − indirim %) */
export function foreignToTryExchange(amount: number, currency: string, rates: Map<string, ExchangeRateRow>): number {
  if (currency === 'TRY') return amount;
  const row = rates.get(currency);
  if (!row?.tryPerUnitExchange) return amount;
  return amount * row.tryPerUnitExchange;
}

export function tryToForeign(tryAmount: number, currency: string, rates: Map<string, ExchangeRateRow>): number {
  if (currency === 'TRY') return tryAmount;
  const row = rates.get(currency);
  if (!row?.tryPerUnitBuy) return tryAmount;
  return tryAmount / row.tryPerUnitBuy;
}

/** Döviz tutarı ve TL karşılığını birlikte gösterir (TCMB alış) */
export function formatDualMoney(
  amount: number,
  currency: string,
  rates: Map<string, ExchangeRateRow>,
): { primary: string; secondary: string | null; tryAmount: number } {
  const tryAmount = foreignToTry(amount, currency, rates);
  if (currency === 'TRY') {
    return { primary: formatMoney(amount, 'TRY'), secondary: null, tryAmount: amount };
  }
  return {
    primary: formatMoney(amount, currency),
    secondary: formatMoney(tryAmount, 'TRY'),
    tryAmount,
  };
}

export function isPaymentCurrency(code: string): code is import('@/lib/exchange/types').PaymentCurrency {
  return code.length === 3;
}
