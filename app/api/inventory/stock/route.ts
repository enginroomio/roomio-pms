import { NextResponse } from 'next/server';
import { addStockMovement, getStockItems } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, hasPermission } from '@/lib/auth/roles';
import { tokenFromRequest, verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

async function authUser(req: Request) {
  const token = tokenFromRequest(req);
  if (!token) return getDemoSession('fo_manager');
  const payload = await verifyToken(token);
  return payload ? getDemoSession(payload.role) : getDemoSession('fo_manager');
}

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const items = await getStockItems(propertyId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await authUser(req);
  if (!hasPermission(user, 'accounting.write')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { stockId: string; type: 'in' | 'out'; qty: number; note?: string };
    const updated = await addStockMovement(body.stockId, body.type, body.qty, body.note, user.id);
    if (!updated) return NextResponse.json({ error: 'Stok hareketi başarısız' }, { status: 400 });
    return NextResponse.json({ ok: true, item: updated });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
