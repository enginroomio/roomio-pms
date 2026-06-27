import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { createPurchaseRequest } from '@/lib/integrations/procurement/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    department?: string;
    item?: string;
    quantity?: number;
    estimatedCost?: number;
  };

  if (!body.department?.trim() || !body.item?.trim() || !body.quantity || body.estimatedCost == null) {
    return NextResponse.json(
      { ok: false, message: 'department, item, quantity, estimatedCost gerekli' },
      { status: 400 },
    );
  }

  return NextResponse.json(await createPurchaseRequest({
    department: body.department,
    item: body.item,
    quantity: Number(body.quantity),
    estimatedCost: Number(body.estimatedCost),
  }));
}
