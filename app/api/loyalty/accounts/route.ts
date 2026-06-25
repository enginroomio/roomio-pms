import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import {
  ensureDemoLoyaltySeeded,
  ensureLoyaltyAccount,
  getAccountTransactions,
  getLoyaltyAccountByEmail,
  listLoyaltyAccounts,
} from '@/lib/loyalty/service';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireApiAnyPermission(request, ['reports.export', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  await ensureDemoLoyaltySeeded(propertyId);
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const query = searchParams.get('q') ?? undefined;

  if (email) {
    const account = await getLoyaltyAccountByEmail(email, propertyId);
    if (!account) return NextResponse.json({ account: null });
    const transactions = await getAccountTransactions(account.id);
    return NextResponse.json({ account, transactions });
  }

  const accounts = await listLoyaltyAccounts(propertyId, { query });
  return NextResponse.json({ count: accounts.length, accounts });
}

export async function POST(request: Request) {
  const auth = await requireApiAnyPermission(request, ['reception.checkout', 'cash.write', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    guestName?: string;
    email?: string;
    phone?: string;
  };

  if (!body.guestName?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'guestName ve email gerekli' }, { status: 400 });
  }

  const account = await ensureLoyaltyAccount({
    guestName: body.guestName,
    email: body.email,
    phone: body.phone,
    propertyId,
  });
  return NextResponse.json({ ok: true, account });
}
