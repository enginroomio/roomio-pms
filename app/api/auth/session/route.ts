import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/auth/config';
import { isAuthRequired } from '@/lib/auth/config';
import { getJwtPayloadFromRequest } from '@/lib/auth/request-token';
import { ROLE_LABELS, getDemoSession, hasPermission } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { buildSessionUserFromAuth } from '@/lib/auth/session-user';
import { getInvoices, getLedgerEntries, getStockItems } from '@/lib/server/pms-store';
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
  const role = (searchParams.get('role') ?? 'fo_manager') as Role;
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

export async function POST(req: Request) {
  const payload = await getJwtPayloadFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await buildSessionUserFromAuth(payload.sub, payload.name, payload.role, payload.groupCode);
  if (!hasPermission(session, 'settings.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, message: 'Admin action placeholder' });
}
