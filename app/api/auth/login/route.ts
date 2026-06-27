import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE, TOKEN_MAX_AGE_SEC } from '@/lib/auth/config';
import { signToken } from '@/lib/auth/jwt';
import { ROLE_LABELS } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { registerSession } from '@/lib/auth/session-store';
import { findUserByEmail } from '@/lib/server/pms-store';
import { checkAccountLock, getUserMustChangePassword, recordFailedLogin, touchUserLogin } from '@/lib/server/users-admin';
import { checkRateLimit, clientIpFromRequest, rateLimitHeaders } from '@/lib/server/rate-limit';
import { logApiError } from '@/lib/server/api-error';
import { loginSchema, firstZodError } from '@/lib/validation/auth';

export const dynamic = 'force-dynamic';

// IP başına: 15 dakikada en fazla 20 giriş denemesi (paylaşılan ofis/otel
// IP'lerinde birden fazla kullanıcı giriş yapabileceği için biraz gevşek).
const IP_LIMIT = 20;
const IP_WINDOW_SEC = 15 * 60;
// IP + e-posta kombinasyonu başına: aynı hesaba karşı kaba kuvvet denemesini
// engellemek için daha sıkı bir limit.
const ACCOUNT_LIMIT = 5;
const ACCOUNT_WINDOW_SEC = 15 * 60;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);

    const ipResult = await checkRateLimit(`login:ip:${ip}`, IP_LIMIT, IP_WINDOW_SEC);
    if (!ipResult.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: rateLimitHeaders(ipResult) },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    const normalizedEmail = body.email.trim().toLowerCase();
    const accountResult = await checkRateLimit(
      `login:account:${ip}:${normalizedEmail}`,
      ACCOUNT_LIMIT,
      ACCOUNT_WINDOW_SEC,
    );
    if (!accountResult.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: rateLimitHeaders(accountResult) },
      );
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user || user.active === false) {
      return NextResponse.json({ error: 'Geçersiz giriş bilgileri' }, { status: 401 });
    }

    // Hesap bazlı kilit — rate limit'ten (IP+hesap, kısa pencere) ayrı bir
    // savunma katmanı: doğrudan kullanıcı kaydına bağlı olduğu için IP
    // değiştirilerek (proxy/botnet) aşılamaz. Mesaj kasıtlı olarak "geçersiz
    // giriş bilgileri" ile aynı formatta değil — kilitliyken kullanıcının bu
    // durumdan haberdar olması (ve destek hattını arayabilmesi) faydalıdır,
    // bu da e-posta enumeration riski taşımaz çünkü zaten doğru e-postayı
    // biliyor olmaları gerekir (bir önceki başarısız denemelerinden).
    const lockStatus = await checkAccountLock(user.id);
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: 'Hesap çok sayıda başarısız denemeden sonra geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.' },
        { status: 423, headers: { 'Retry-After': String(lockStatus.retryAfterSec) } },
      );
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      await recordFailedLogin(user.id).catch(() => undefined);
      return NextResponse.json({ error: 'Geçersiz giriş bilgileri' }, { status: 401 });
    }

    const role = user.role as Role;
    const jti = crypto.randomUUID();
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
      groupCode: user.groupCode ?? undefined,
      jti,
    });
    await registerSession(user.id, jti);
    await touchUserLogin(user.id);
    const session = await buildSessionUserFromAuth(user.id, user.name, role, user.groupCode);
    const mustChangePassword = user.mustChangePassword ?? await getUserMustChangePassword(user.id);

    const response = NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        roleLabel: session.roleLabel,
        permissions: session.permissions,
        mustChangePassword,
      },
      roles: Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label })),
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_MAX_AGE_SEC,
    });

    return response;
  } catch (err) {
    logApiError('POST /api/auth/login', err);
    return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}
