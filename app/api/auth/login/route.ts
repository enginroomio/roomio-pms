import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AUTH_COOKIE, TOKEN_MAX_AGE_SEC } from '@/lib/auth/config';
import { signToken } from '@/lib/auth/jwt';
import { ROLE_LABELS } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { registerSession } from '@/lib/auth/session-store';
import { findUserByEmail } from '@/lib/server/pms-store';
import { getUserMustChangePassword } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 });
    }

    const user = await findUserByEmail(body.email.trim().toLowerCase());
    if (!user || user.active === false) {
      return NextResponse.json({ error: 'Geçersiz giriş bilgileri' }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
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
  } catch {
    return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}
