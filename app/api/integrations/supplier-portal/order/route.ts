import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { createSupplierOrder } from '@/lib/integrations/supplier-portal/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    supplierId?: string;
    item?: string;
    quantity?: number;
    notes?: string;
  };

  if (!body.supplierId?.trim() || !body.item?.trim() || !body.quantity) {
    return NextResponse.json({ ok: false, message: 'supplierId, item, quantity gerekli' }, { status: 400 });
  }

  return NextResponse.json(await createSupplierOrder({
    supplierId: body.supplierId,
    item: body.item,
    quantity: Number(body.quantity),
    notes: body.notes,
  }));
}
