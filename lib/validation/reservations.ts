import { z } from 'zod';

/**
 * Reservation route'ları için hedefli zod yardımcıları.
 *
 * Tüm `Reservation` tipini zod şemasına çevirmek (17 alan, POST/PATCH için
 * farklı zorunluluk kuralları, mevcut `validateReservationNumericFields`/
 * `validateMarketForReservation` ile çakışma riski) bu oturumda kapsam dışı
 * tutuldu — gerçek bir derleyici olmadan büyük bir şemayı güvenle test etmek
 * mümkün değildi. Bunun yerine, önceden HİÇ kontrol edilmeyen tek bir gerçek
 * boşluk (tarih formatı) hedefli olarak kapatıldı.
 */

// YYYY-MM-DD formatı — projede tarihler bu formatta string olarak tutuluyor
// (Prisma şemasında `checkIn String`, Date tipi değil).
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı YYYY-AA-GG olmalıdır');

export const reservationDatesSchema = z.object({
  checkIn: dateString,
  checkOut: dateString,
});

/**
 * `checkIn`/`checkOut` formatını doğrular. Sadece bu iki alan varsa
 * (POST'ta zorunlu, PATCH'te opsiyonel) kontrol eder — `Partial` body'lerde
 * alan hiç gönderilmemişse hata vermez (mevcut "varlık kontrolü" mantığı
 * route'ta zaten ayrıca yapılıyor).
 */
export function validateReservationDateFormats(body: {
  checkIn?: unknown;
  checkOut?: unknown;
}): string | null {
  if (body.checkIn !== undefined) {
    const r = dateString.safeParse(body.checkIn);
    if (!r.success) return 'checkIn: ' + (r.error.issues[0]?.message ?? 'geçersiz tarih');
  }
  if (body.checkOut !== undefined) {
    const r = dateString.safeParse(body.checkOut);
    if (!r.success) return 'checkOut: ' + (r.error.issues[0]?.message ?? 'geçersiz tarih');
  }
  return null;
}
