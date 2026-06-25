import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { earnLoyaltyPoints } from '@/lib/loyalty/service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireApiAnyPermission(request, ['reception.checkout', 'cash.write', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    accountId?: string;
    guestName?: string;
    email?: string;
    phone?: string;
    nights?: number;
    spendTry?: number;
    agencyCode?: string;
    reservationId?: string;
    refNo?: string;
    description?: string;
  };

  const result = await earnLoyaltyPoints({
    accountId: body.accountId,
    guestName: body.guestName,
    email: body.email,
    phone: body.phone,
    nights: Number(body.nights ?? 0),
    spendTry: Number(body.spendTry ?? 0),
    agencyCode: body.agencyCode,
    reservationId: body.reservationId,
    refNo: body.refNo,
    description: body.description,
    propertyId,
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Puan kazanılamadı (program kapalı veya 0 puan)' });
  }
  return NextResponse.json({ ok: true, ...result });
}
