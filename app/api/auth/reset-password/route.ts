import { NextResponse } from 'next/server';
import { z } from 'zod';
import { claimPasswordResetToken } from '@/lib/server/password-reset';
import { changeUserPassword } from '@/lib/server/users-admin';
import { revokeAllUserSessions } from '@/lib/auth/session-store';
import { checkRateLimit, clientIpFromRequest, rateLimitHeaders } from '@/lib/server/rate-limit';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1).max(500),
    newPassword: z.string().min(1).max(512),
    confirmPassword: z.string().min(1).max(512),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

// Token tahmin etmeye karşı IP bazlı limit — token'lar zaten kriptografik
// olarak tahmin edilemez (32 byte rastgele), ama bu ek bir savunma katmanı.
const LIMIT = 10;
const WINDOW_SEC = 60 * 60;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);
    const limitResult = await checkRateLimit(`reset-password:ip:${ip}`, LIMIT, WINDOW_SEC);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: rateLimitHeaders(limitResult) },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
        { status: 400 },
      );
    }
    const { token, newPassword } = parsed.data;

    // Token'ı ÖNCE atomik olarak "claim" ediyoruz (tek kullanımlık olarak
    // işaretliyoruz), sonra şifreyi değiştiriyoruz. Bu sıralama bilinçli:
    // eşzamanlı iki istek aynı token'la gelirse, sadece biri claim'i kazanır
    // (DB seviyesinde atomik `updateMany`); şifre politikası hatası (örn.
    // çok kısa şifre) durumunda token zaten tüketilmiş sayılır ve kullanıcı
    // yeni bir link istemek zorunda kalır — bu, çift-kullanım riskini
    // tamamen ortadan kaldırmanın kabul edilebilir maliyetidir.
    const claim = await claimPasswordResetToken(token);
    if (!claim.ok) {
      const message =
        claim.reason === 'expired'
          ? 'Bağlantının süresi dolmuş. Lütfen yeni bir sıfırlama talebi oluşturun.'
          : claim.reason === 'used'
            ? 'Bu bağlantı zaten kullanılmış. Lütfen yeni bir sıfırlama talebi oluşturun.'
            : 'Geçersiz bağlantı.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    try {
      await changeUserPassword(claim.userId, { newPassword, force: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifre değiştirilemedi';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Self-service reset genellikle hesabın ele geçirildiği şüphesiyle
    // yapılır, bu yüzden "hariç tutulacak oturum" yok — hepsi kapatılır.
    await revokeAllUserSessions(claim.userId).catch((err) => {
      logApiError('POST /api/auth/reset-password (revoke-sessions)', err, { userId: claim.userId });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logApiError('POST /api/auth/reset-password', err);
    return NextResponse.json({ error: 'Şifre sıfırlama başarısız' }, { status: 500 });
  }
}
