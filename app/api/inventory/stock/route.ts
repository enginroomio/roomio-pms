import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { addStockMovement, getStockItems } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const items = await getStockItems(propertyId);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'accounting.write');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = (await req.json()) as { stockId: string; type: 'in' | 'out'; qty: number; note?: string };
    const updated = await addStockMovement(body.stockId, body.type, body.qty, body.note, user.id);
    if (!updated) return NextResponse.json({ error: 'Stok hareketi başarısız' }, { status: 400 });
    return NextResponse.json({ ok: true, item: updated });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
