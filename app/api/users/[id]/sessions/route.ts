import { NextResponse } from 'next/server';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { listUserSessions, revokeAllUserSessions, revokeToken } from '@/lib/auth/session-store';
import { isRedisConfigured } from '@/lib/server/redis';
import { findUserById } from '@/lib/server/users-admin';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  try {
    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    const sessions = await listUserSessions(id);
    return NextResponse.json({
      ok: true,
      // Redis yoksa da oturumlar DB'de takip edilir (bkz. lib/auth/session-store.ts);
      // bu alan sadece hangi depolama katmanının kullanıldığını gösterir.
      redis: isRedisConfigured(),
      storageBackend: isRedisConfigured() ? 'redis' : 'database',
      sessions,
    });
  } catch (err) {
    logApiError('GET /api/users/[id]/sessions', err, { targetUserId: id });
    return NextResponse.json({ error: 'sessions fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  try {
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
    return NextResponse.json({
      ok: true,
      revoked,
      redis: isRedisConfigured(),
      storageBackend: isRedisConfigured() ? 'redis' : 'database',
    });
  } catch (err) {
    logApiError('POST /api/users/[id]/sessions', err, { targetUserId: id });
    return NextResponse.json({ error: 'session revoke failed' }, { status: 500 });
  }
}
