import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { getAuditLogsForUser } from '@/lib/server/audit-log';
import { findUserById } from '@/lib/server/users-admin';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const auth = await requireApiAnyPermission(req, ['settings.admin', 'identity.read']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const user = await findUserById(id);
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const limit = Number(new URL(req.url).searchParams.get('limit') ?? 50);
  const logs = await getAuditLogsForUser(user.name, user.id, Math.min(limit, 200));

  return NextResponse.json({ ok: true, logs });
}
