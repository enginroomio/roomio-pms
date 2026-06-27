import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';
import { appendAuditLog } from '@/lib/server/audit-log';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

/**
 * Self-service şifre sıfırlama akışı.
 *
 * Akış: kullanıcı e-postasını girer → (kullanıcı var/yok bilgisi sızdırmadan)
 * her zaman "bağlantı gönderildi" mesajı döner → eğer kullanıcı varsa
 * tek-kullanımlık bir token üretilip DB'ye kaydedilir ve e-posta kuyruğuna
 * eklenir (webhook yapılandırılmamışsa "queued" kalır, hata vermez — bkz.
 * lib/server/email-outbox.ts) → kullanıcı linke tıklar → yeni şifre +
 * token ile `/api/auth/reset-password`'e POST eder → token doğrulanır,
 * tüketilir (tekrar kullanılamaz), şifre değiştirilir, tüm oturumlar
 * geçersiz kılınır.
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat — kısa ömürlü, riski sınırlar.

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

/** Kriptografik olarak güçlü, URL-güvenli rastgele token üretir. */
function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Bir kullanıcı için sıfırlama token'ı oluşturur ve DB'ye kaydeder.
 * Aynı kullanıcının önceki, henüz kullanılmamış token'larını geçersiz
 * kılmaz (silmez) — bu kasıtlı: kullanıcı birden fazla cihazdan/sekmeden
 * "şifremi unuttum" derse, en son linkin değil, hangisine tıklarsa o
 * çalışmalı. Süresi geçmiş/kullanılmış token'lar zaten `claimPasswordResetToken`
 * tarafından reddedilir.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  await init();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  });
  return token;
}

export type ResetTokenCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_found' | 'expired' | 'used' };

/** Token'ı tüketmeden sadece geçerliliğini kontrol eder (ön-doğrulama için). */
export async function checkPasswordResetToken(token: string): Promise<ResetTokenCheck> {
  await init();
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.usedAt) return { ok: false, reason: 'used' };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  return { ok: true, userId: row.userId };
}

/**
 * Token'ı ATOMİK olarak "kullanıldı" işaretler ve hangi kullanıcıya ait
 * olduğunu döner — sadece henüz kullanılmamışsa başarılı olur. Bu,
 * `checkPasswordResetToken` + ayrı bir `update` çağrısı arasında oluşabilecek
 * bir race condition'ı (aynı token'la eşzamanlı iki istek, ikisi de geçerli
 * görüp şifreyi iki kez değiştirmesi) önler: `updateMany` koşulunda
 * `usedAt: null` şartı olduğu için, yarışı kazanan tek bir istek olur
 * (veritabanı bunu atomik olarak garanti eder).
 *
 * Şifre değişikliğinden ÖNCE çağrılmalıdır (claim-then-act deseni) — token
 * önce "rezerve edilir", sonra şifre değiştirilir. Şifre değişikliği
 * başarısız olursa token zaten tüketilmiş sayılır (kullanıcı yeni bir link
 * istemek zorunda kalır) — bu, race condition'ı önlemenin kabul edilebilir
 * bir maliyetidir; aksi yöndeki sıralama (önce değiştir, sonra tüket) ise
 * tam olarak önlemeye çalıştığımız çift-kullanım riskini geri getirirdi.
 */
export async function claimPasswordResetToken(token: string): Promise<ResetTokenCheck> {
  await init();
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.usedAt) return { ok: false, reason: 'used' };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'expired' };

  const result = await prisma.passwordResetToken.updateMany({
    where: { token, usedAt: null },
    data: { usedAt: new Date().toISOString() },
  });
  if (result.count === 0) {
    // Bu noktaya kadar geçerliydi ama tam bu anda başka bir istek tüketti.
    return { ok: false, reason: 'used' };
  }
  await appendAuditLog({
    module: 'auth',
    action: 'password_reset_token_claimed',
    entityType: 'User',
    entityId: row.userId,
    user: 'system',
    detail: 'Self-service şifre sıfırlama token tüketildi',
  }, pid()).catch(() => undefined);
  return { ok: true, userId: row.userId };
}

/** Süresi geçmiş/kullanılmış token kayıtlarını temizler (best-effort). */
export async function cleanupExpiredResetTokens(): Promise<void> {
  await init();
  const now = new Date().toISOString();
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
}
