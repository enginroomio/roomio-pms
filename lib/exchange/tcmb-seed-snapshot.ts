import type { ExchangeRateRow } from '@/lib/exchange/types';
import { CURRENCY_SYMBOLS } from '@/lib/exchange/types';

/** Demo/offline başlangıç — Elektra screen-000 referans USD/EUR; diğerleri yaklaşık TCMB formatı */
export function buildTcmbSeedRates(businessDate: string): { date: string; rates: ExchangeRateRow[] } {
  const rows: Array<{ code: string; name: string; unit: number; buy: number }> = [
    { code: 'USD', name: 'ABD DOLARI', unit: 1, buy: 39.162 },
    { code: 'EUR', name: 'EURO', unit: 1, buy: 44.85 },
    { code: 'GBP', name: 'İNGİLİZ STERLİNİ', unit: 1, buy: 49.42 },
    { code: 'CHF', name: 'İSVİÇRE FRANGI', unit: 1, buy: 43.18 },
    { code: 'SAR', name: 'SUUDİ ARABİSTAN RİYALİ', unit: 1, buy: 10.44 },
    { code: 'RUB', name: 'RUS RUBLESİ', unit: 1, buy: 0.4125 },
    { code: 'AED', name: 'BİRLEŞİK ARAP EMİRLİKLERİ DİRHEMİ', unit: 1, buy: 10.66 },
    { code: 'JPY', name: 'JAPON YENİ', unit: 100, buy: 26.84 },
  ];

  const rates: ExchangeRateRow[] = rows.map((r) => {
    const tryPerUnitBuy = r.buy / r.unit;
    return {
      code: r.code,
      name: r.name,
      unit: r.unit,
      symbol: CURRENCY_SYMBOLS[r.code] ?? r.code,
      tryPerUnit: tryPerUnitBuy,
      tryPerUnitBuy,
      tryPerUnitSell: tryPerUnitBuy * 1.02,
      tryPerUnitExchange: tryPerUnitBuy,
      forexBuying: r.buy,
      forexSelling: r.buy * 1.02,
      banknoteBuying: r.buy,
      banknoteSelling: r.buy * 1.02,
    };
  });

  return { date: businessDate, rates };
}
