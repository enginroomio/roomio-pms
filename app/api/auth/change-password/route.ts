import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { validatePassword } from '@/lib/auth/password';
import { changeUserPassword, getUserMustChangePassword } from '@/lib/server/users-admin';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { revokeAllUserSessions } from '@/lib/auth/session-store';
import { logApiError } from '@/lib/server/api-error';
import { changePasswordSchema, firstZodError } from '@/lib/validation/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const json = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const mustChange = await getUserMustChangePassword(user.id);
    const policyErr = validatePassword(body.newPassword);
    if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });

    await changeUserPassword(user.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      force: mustChange,
    });

    // Şifre değişti — mevcut oturum hariç tüm diğer oturumları geçersiz kıl.
    // Bu, çalınmış bir token'ın şifre değiştirilse bile süresine kadar
    // geçerli kalmasını önler (önceden bu hiç yapılmıyordu).
    const payload = await getJwtPayloadFromRequest(req);
    await revokeAllUserSessions(user.id, payload?.jti).catch((err) => {
      logApiError('POST /api/auth/change-password (revoke-sessions)', err, { userId: user.id });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Şifre değerleri loglanmaz; sadece hangi kullanıcı/işlem için hata
    // oluştuğu (userId) raporlanır.
    logApiError('POST /api/auth/change-password', err, { userId: user.id });
    const message = err instanceof Error ? err.message : 'Şifre değiştirilemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
