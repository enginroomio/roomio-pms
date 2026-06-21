/** Kur bozdurma: TCMB alış kurundan düşülen oran (%) */

export type ExchangeConfig = {
  /** Misafir döviz bozdururken TCMB alıştan düşülen yüzde */
  exchangeDiscountPct: number;
  updatedAt?: string;
};

export const DEFAULT_EXCHANGE_CONFIG: ExchangeConfig = {
  exchangeDiscountPct: 2,
};

/** TCMB alış kuruna kur bozdurma indirimini uygular */
export function exchangeRateFromTcmb(tcmbBuyRate: number, discountPct: number): number {
  if (discountPct <= 0) return tcmbBuyRate;
  return tcmbBuyRate * (1 - discountPct / 100);
}
