import { NextResponse } from 'next/server';
import { getInvoices, getLedgerEntries, getStockItems } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, ROLE_LABELS, hasPermission } from '@/lib/auth/roles';
import type { Role } from '@/lib/auth/roles';
import { tokenFromRequest, verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const token = tokenFromRequest(req);
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const session = getDemoSession(payload.role);
      const [invoices, stock, ledger] = await Promise.all([getInvoices(propertyId), getStockItems(propertyId), getLedgerEntries(propertyId)]);
      return NextResponse.json({
        ok: true,
        user: { id: payload.sub, name: payload.name, email: payload.email, role: payload.role, roleLabel: session.roleLabel, permissions: session.permissions },
        roles: Object.entries(ROLE_LABELS).map(([id, label]) => ({ id, label })),
        invoices,
        stock,
        ledger,
        authenticated: true,
      });
    }
  }

  const { searchParams } = new URL(req.url);
  const role = (searchParams.get('role') ?? 'fo_manager') as Role;
  const user = getDemoSession(role);
  const [invoices, stock, ledger] = await Promise.all([getInvoices(propertyId), getStockItems(propertyId), getLedgerEntries(propertyId)]);
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
  const token = tokenFromRequest(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const session = getDemoSession(payload.role);
  if (!hasPermission(session, 'settings.admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, message: 'Admin action placeholder' });
}
