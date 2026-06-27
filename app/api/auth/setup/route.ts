import { NextResponse } from 'next/server';
import { AUTH_COOKIE, TOKEN_MAX_AGE_SEC } from '@/lib/auth/config';
import { signToken } from '@/lib/auth/jwt';
import { ROLE_LABELS } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { registerSession } from '@/lib/auth/session-store';
import { validatePassword } from '@/lib/auth/password';
import { bootstrapFirstAdmin, getAuthSetupStatus } from '@/lib/server/users-admin';
import { checkRateLimit, clientIpFromRequest, rateLimitHeaders } from '@/lib/server/rate-limit';
import { logApiError } from '@/lib/server/api-error';
import { setupSchema, firstZodError } from '@/lib/validation/auth';

export const dynamic = 'force-dynamic';

// İlk kurulum nadiren çağrılır; `needsSetup` zaten admin oluşturulduktan
// sonra bu endpoint'i doğal olarak kapatır. Burada amaç, kurulum öncesi
// kısa pencerede spam/DoS denemesini sınırlamak.
const SETUP_LIMIT = 5;
const SETUP_WINDOW_SEC = 60 * 60;

export async function POST(req: Request) {
  try {
    const ip = clientIpFromRequest(req);
    const limitResult = await checkRateLimit(`setup:ip:${ip}`, SETUP_LIMIT, SETUP_WINDOW_SEC);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: rateLimitHeaders(limitResult) },
      );
    }

    const status = await getAuthSetupStatus();
    if (!status.needsSetup) {
      return NextResponse.json({ error: 'Kurulum zaten tamamlanmış' }, { status: 409 });
    }

    const json = await req.json().catch(() => null);
    const parsed = setupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    }
    const body = parsed.data;

    // Şifre politikası (min uzunluk, harf+rakam) zod şemasının dışında
    // tutuldu — `validatePassword` zaten merkezi ve diğer akışlarla
    // (change-password, admin reset) paylaşılan bir fonksiyon, burada
    // çağrısını korumak tutarlılığı sağlar.
    const policyErr = validatePassword(body.password);
    if (policyErr) return NextResponse.json({ error: policyErr }, { status: 400 });

    const admin = await bootstrapFirstAdmin({
      email: body.email,
      name: body.name,
      password: body.password,
      propertyName: body.propertyName,
    });

    const role = 'admin' as Role;
    const jti = crypto.randomUUID();
    const token = await signToken({
      sub: admin.id,
      email: admin.email,
      name: admin.fullName,
      role,
      groupCode: admin.groupCode ?? undefined,
      jti,
    });
    await registerSession(admin.id, jti);
    const session = await buildSessionUserFromAuth(admin.id, admin.fullName, role, admin.groupCode);

    const response = NextResponse.json({
      ok: true,
      token,
      user: {
        id: admin.id,
        name: admin.fullName,
        email: admin.email,
        role,
        roleLabel: session.roleLabel,
        permissions: session.permissions,
        mustChangePassword: false,
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
    logApiError('POST /api/auth/setup', err);
    const message = err instanceof Error ? err.message : 'Kurulum başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
