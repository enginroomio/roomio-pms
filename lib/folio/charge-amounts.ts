import type { FolioLine } from '@/lib/data/reception-queries';
import type { Reservation } from '@/lib/types/reservation';

/** Rezervasyonda kayıtlı giriş günü TCMB alış kuru */
export function reservationExchangeRate(r: Reservation): number {
  const currency = String(r.currency ?? 'TRY');
  if (currency === 'TRY') return 1;
  const stored = Number(r.extraData?.exchangeRate ?? 0);
  return stored > 0 ? stored : 0;
}

/** Döviz tutarını rezervasyon kuruna göre TL'ye çevirir */
export function foreignToTryReservation(foreignAmount: number, r: Reservation): number {
  const currency = String(r.currency ?? 'TRY');
  if (currency === 'TRY') return foreignAmount;
  const rate = reservationExchangeRate(r);
  if (!rate) return foreignAmount;
  return Math.round(foreignAmount * rate);
}

/** Folyo satırı — bakiye TRY, gösterim döviz + TL */
export function buildFolioChargeAmounts(
  foreignAmount: number,
  r: Reservation,
): Pick<FolioLine, 'amount' | 'currency' | 'foreignAmount' | 'exchangeRate'> {
  const currency = String(r.currency ?? 'TRY');
  if (currency === 'TRY') {
    return { amount: foreignAmount, currency: 'TRY' };
  }
  const exchangeRate = reservationExchangeRate(r);
  return {
    amount: exchangeRate > 0 ? Math.round(foreignAmount * exchangeRate) : foreignAmount,
    currency,
    foreignAmount,
    exchangeRate: exchangeRate > 0 ? exchangeRate : undefined,
  };
}
