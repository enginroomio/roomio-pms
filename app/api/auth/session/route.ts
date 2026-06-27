import { NextResponse } from 'next/server';
import { isAuthRequired } from '@/lib/auth/config';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { ROLE_LABELS, getDemoSession, hasPermission, normalizeRole } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { revokeToken } from '@/lib/auth/session-store';
import { isRedisConfigured } from '@/lib/server/redis';
import { getInvoices, getLedgerEntries, getStockItems } from '@/lib/server/pms-store';
import { getUserMustChangePassword } from '@/lib/server/users-admin';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const payload = await getJwtPayloadFromRequest(req);

  if (payload) {
    const session = await buildSessionUserFromAuth(
      payload.sub,
      payload.name,
      payload.role,
      payload.groupCode,
      propertyId,
    );
    const mustChangePassword = await getUserMustChangePassword(payload.sub);
    const [invoices, stock, ledger] = await Promise.all([
      getInvoices(propertyId),
      getStockItems(propertyId),
      getLedgerEntries(propertyId),
    ]);
    return NextResponse.json({
      ok: true,
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        roleLabel: session.roleLabel,
        permissions: session.permissions,
        mustChangePassword,
      },
      roles: Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label })),
      invoices,
      stock,
      ledger,
      authenticated: true,
    });
  }

  if (isAuthRequired()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized', authenticated: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = normalizeRole(searchParams.get('role'));
  const user = getDemoSession(role);
  const [invoices, stock, ledger] = await Promise.all([
    getInvoices(propertyId),
    getStockItems(propertyId),
    getLedgerEntries(propertyId),
  ]);
  return NextResponse.json({
    ok: true,
    user,
    roles: Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label })),
    invoices,
    stock,
    ledger,
    authenticated: false,
  });
}

type SessionAdminAction = 'ping' | 'revoke';

export async function POST(req: Request) {
  const payload = await getJwtPayloadFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await buildSessionUserFromAuth(payload.sub, payload.name, payload.role, payload.groupCode);
  if (!hasPermission(session, 'settings.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { action?: SessionAdminAction; jti?: string };
  const action = body.action ?? 'ping';

  if (action === 'ping') {
    return NextResponse.json({
      ok: true,
      message: 'Oturum yönetimi aktif',
      redis: isRedisConfigured(),
      userId: payload.sub,
    });
  }

  if (action === 'revoke') {
    const jti = body.jti?.trim();
    if (!jti) {
      return NextResponse.json({ error: 'jti gerekli' }, { status: 400 });
    }
    await revokeToken(jti);
    return NextResponse.json({ ok: true, message: 'Oturum iptal edildi', jti });
  }

  return NextResponse.json({ error: 'Geçersiz işlem — action: ping | revoke' }, { status: 400 });
}
