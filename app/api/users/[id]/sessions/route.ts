import { NextResponse } from 'next/server';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { listUserSessions, revokeAllUserSessions, revokeToken } from '@/lib/auth/session-store';
import { isRedisConfigured } from '@/lib/server/redis';
import { findUserById } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireApiPermission(_req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const user = await findUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const sessions = await listUserSessions(id);
  return NextResponse.json({
    ok: true,
    redis: isRedisConfigured(),
    sessions,
  });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const user = await findUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: 'revoke-all' | 'revoke';
    jti?: string;
  };

  const payload = await getJwtPayloadFromRequest(req);
  const exceptJti = payload?.sub === id ? payload.jti : undefined;

  if (body.action === 'revoke' && body.jti) {
    await revokeToken(body.jti);
    return NextResponse.json({ ok: true, revoked: 1 });
  }

  const revoked = await revokeAllUserSessions(id, exceptJti);
  return NextResponse.json({ ok: true, revoked, redis: isRedisConfigured() });
}
