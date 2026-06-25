import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { chargeVirtualPos } from '@/lib/integrations/virtual-pos/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    amount?: number;
    currency?: string;
    refNo?: string;
    cardHolder?: string;
  };

  if (!body.amount || !body.currency?.trim() || !body.refNo?.trim()) {
    return NextResponse.json({ ok: false, message: 'amount, currency, refNo gerekli' }, { status: 400 });
  }

  return NextResponse.json(await chargeVirtualPos({
    amount: Number(body.amount),
    currency: body.currency,
    refNo: body.refNo,
    cardHolder: body.cardHolder,
  }));
}
