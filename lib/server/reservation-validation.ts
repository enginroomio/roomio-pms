import { isMarketRequiredServer } from '@/lib/server/user-params';
import type { Reservation } from '@/lib/types/reservation';

export async function validateMarketForReservation(
  market: string | undefined,
  propertyId?: string,
): Promise<string | null> {
  const required = await isMarketRequiredServer(propertyId);
  if (required && !market?.trim()) return 'Market kodu zorunlu';
  return null;
}

/**
 * Rezervasyonun sayısal alanlarını (rate, adults, children) doğrular.
 * Önceden bu alanlar hiç doğrulanmıyordu — `rate` negatif/sonsuz veya
 * `adults` negatif/ondalıklı gibi değerler doğrudan veritabanına
 * yazılabiliyordu. Bu fonksiyon hem POST (yeni rezervasyon) hem PATCH
 * (güncelleme) için kullanılır; PATCH'te yalnızca gönderilen (undefined
 * olmayan) alanlar kontrol edilir.
 */
export function validateReservationNumericFields(
  body: Partial<Pick<Reservation, 'rate' | 'adults' | 'children'>>,
): string | null {
  if (body.rate !== undefined) {
    if (typeof body.rate !== 'number' || !Number.isFinite(body.rate) || body.rate < 0) {
      return 'rate negatif olmayan geçerli bir sayı olmalıdır';
    }
  }
  if (body.adults !== undefined) {
    if (typeof body.adults !== 'number' || !Number.isInteger(body.adults) || body.adults < 1) {
      return 'adults en az 1 olan bir tam sayı olmalıdır';
    }
  }
  if (body.children !== undefined) {
    if (typeof body.children !== 'number' || !Number.isInteger(body.children) || body.children < 0) {
      return 'children negatif olmayan bir tam sayı olmalıdır';
    }
  }
  return null;
}
