import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/server/pms-store';
import { signToken } from '@/lib/auth/jwt';
import { registerSession } from '@/lib/auth/session-store';
import { getDemoSession, ROLE_LABELS } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'email ve password gerekli' }, { status: 400 });
    }

    const user = await findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json({ error: 'Geçersiz giriş' }, { status: 401 });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Geçersiz giriş' }, { status: 401 });
    }

    const role = user.role as Role;
    const jti = crypto.randomUUID();
    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role, jti });
    await registerSession(user.id, jti);
    const session = getDemoSession(role);

    return NextResponse.json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role, roleLabel: session.roleLabel, permissions: session.permissions },
      roles: Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label })),
    });
  } catch {
    return NextResponse.json({ error: 'login failed' }, { status: 500 });
  }
}
