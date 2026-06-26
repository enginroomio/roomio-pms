import { NextResponse } from 'next/server';
import { AUTH_COOKIE, TOKEN_MAX_AGE_SEC } from '@/lib/auth/config';
import { signToken } from '@/lib/auth/jwt';
import { ROLE_LABELS } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { registerSession } from '@/lib/auth/session-store';
import { passwordsMatch, validatePassword } from '@/lib/auth/password';
import { bootstrapFirstAdmin, getAuthSetupStatus } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const status = await getAuthSetupStatus();
    if (!status.needsSetup) {
      return NextResponse.json({ error: 'Kurulum zaten tamamlanmış' }, { status: 409 });
    }

    const body = (await req.json()) as {
      email?: string;
      name?: string;
      password?: string;
      confirmPassword?: string;
      propertyName?: string;
    };

    if (!body.email?.trim() || !body.name?.trim() || !body.password) {
      return NextResponse.json({ error: 'E-posta, ad ve şifre gerekli' }, { status: 400 });
    }
    if (!body.confirmPassword || !passwordsMatch(body.password, body.confirmPassword)) {
      return NextResponse.json({ error: 'Şifreler eşleşmiyor' }, { status: 400 });
    }
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
    const message = err instanceof Error ? err.message : 'Kurulum başarısız';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
