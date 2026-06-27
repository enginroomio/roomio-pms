/**
 * Parasal (amount) alanları için ortak validasyon.
 *
 * `amount <= 0` kontrolü zaten birkaç route'ta (cash, deposits, folio) vardı
 * ama hiçbiri `Number.isFinite` kontrolü yapmıyordu — JSON.parse teorik
 * olarak `Infinity`/`NaN`'i doğrudan üretmez, ama `1e308 * 10` gibi taşan
 * aritmetik veya istemci tarafında hesaplanıp gönderilen bir değer üzerinden
 * sunucuya `Infinity` ulaşabilir. Bu değerler `amount <= 0` kontrolünden
 * geçer (Infinity > 0) ve veritabanına yazılırsa bakiye hesaplamalarını
 * (Prisma Float alanı) bozabilir.
 */
export function isValidPositiveAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
}

/** `amount` geçersizse standart hata mesajını döner, geçerliyse `null`. */
export function validateAmountField(amount: unknown, fieldLabel = 'amount'): string | null {
  if (!isValidPositiveAmount(amount)) {
    return `${fieldLabel} pozitif ve geçerli bir sayı olmalıdır`;
  }
  return null;
}
