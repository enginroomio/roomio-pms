import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { redeemLoyaltyPoints } from '@/lib/loyalty/service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireApiAnyPermission(request, ['reception.checkout', 'cash.write', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    accountId?: string;
    points?: number;
    description?: string;
  };

  if (!body.accountId || !body.points) {
    return NextResponse.json({ error: 'accountId ve points gerekli' }, { status: 400 });
  }

  const result = await redeemLoyaltyPoints({
    accountId: body.accountId,
    points: Number(body.points),
    description: body.description,
    propertyId,
  });

  if ('error' in result) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...result });
}
