/** Ödeme / fiyatlandırma para birimleri */

export const PAYMENT_CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'CHF', 'SAR', 'RUB', 'AED', 'JPY'] as const;

/** Alt durum çubuğu — TCMB günlük kur (TRY hariç) */
export const STATUS_BAR_FX_CODES = ['USD', 'EUR', 'GBP', 'CHF', 'SAR', 'RUB', 'AED', 'JPY'] as const;

export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number];

export type ExchangeRateRow = {
  code: string;
  name: string;
  unit: number;
  symbol: string;
  /** TCMB efektif alış — tüm muhasebe / fiyat hesapları */
  tryPerUnit: number;
  tryPerUnitBuy: number;
  /** TCMB satış — yalnızca bilgi */
  tryPerUnitSell: number;
  /** Kur bozdurma — TCMB alış − indirim % */
  tryPerUnitExchange: number;
  forexBuying: number;
  forexSelling: number;
  banknoteBuying: number;
  banknoteSelling: number;
};

export type ExchangeRateSnapshot = {
  source: 'tcmb';
  date: string;
  updatedAt: string;
  /** Kur bozdurmada TCMB alıştan düşülen yüzde */
  exchangeDiscountPct: number;
  rates: ExchangeRateRow[];
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  SAR: 'SAR',
  RUB: '₽',
  AED: 'AED',
  JPY: '¥',
};
