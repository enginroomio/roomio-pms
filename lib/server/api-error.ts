import { captureException } from '@/lib/monitoring/sentry';

/**
 * API route `catch` bloklarında kullanılan ortak hata raporlama yardımcısı.
 *
 * Önceden çoğu route `catch { return NextResponse.json({error: '...'}, ...) }`
 * deseniyle hatayı tamamen yutuyordu — `err` parametresi bile yakalanmıyordu.
 * Bu, zaten kurulu olan Sentry entegrasyonunun (bkz. lib/monitoring/sentry.ts)
 * hiçbir API hatasını görmediği, ve sunucu loglarında da hiçbir iz kalmadığı
 * anlamına geliyordu — production'da bir "500" raporu geldiğinde kök nedeni
 * teşhis etmek pratik olarak imkansızdı.
 *
 * `route`: hangi endpoint'te olduğunu belirtmek için (örn. "POST /api/eod/night-posting").
 * `context`: ekstra teşhis bilgisi (örn. { propertyId, targetUserId }) —
 * sistem içi ID'ler (propertyId, userId, reservationId) kabul edilebilir,
 * ama e-posta, telefon, şifre, token gibi doğrudan kimlik/kimlik doğrulama
 * bilgisi ASLA buraya geçirilmemeli (Sentry'ye iletilip üçüncü taraf
 * sunucularda saklanır).
 */
export function logApiError(route: string, err: unknown, context?: Record<string, unknown>): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[api-error] ${route}:`, message);
  captureException(err, { route, ...context });
}
