import { NextResponse } from 'next/server';
import {
  createDepositServer,
  getDepositsServer,
  updateDepositStatusServer,
} from '@/lib/server/cash-deposit';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { isValidPositiveAmount } from '@/lib/server/money-validation';
import type { DepositRow } from '@/lib/data/cash';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'cash.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const deposits = await getDepositsServer(propertyId);
    return NextResponse.json({ ok: true, deposits });
  } catch (err) {
    logApiError('GET /api/deposits', err);
    return NextResponse.json({ error: 'deposits fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const auth = await requireApiPermission(req, 'cash.write');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = (await req.json()) as {
    guestName?: string;
    roomNo?: string;
    amount?: number;
    method?: DepositRow['method'];
    reservationId?: string;
    user?: string;
    notes?: string;
  };

  if (!body.guestName?.trim() || !isValidPositiveAmount(body.amount)) {
    return NextResponse.json({ error: 'guestName ve amount gerekli' }, { status: 400 });
  }

  try {
    const deposit = await createDepositServer(
      {
        guestName: body.guestName.trim(),
        roomNo: body.roomNo,
        amount: body.amount,
        method: body.method ?? 'kart',
        reservationId: body.reservationId,
        user: body.user ?? user.name,
        notes: body.notes,
      },
      propertyId,
    );
    return NextResponse.json({ ok: true, deposit });
  } catch (err) {
    logApiError('POST /api/deposits', err, { propertyId });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'deposit create failed' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const auth = await requireApiPermission(req, 'cash.write');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { id?: string; status?: DepositRow['status'] };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id ve status gerekli' }, { status: 400 });
  }
  try {
    const deposit = await updateDepositStatusServer(body.id, body.status, propertyId);
    if (!deposit) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true, deposit });
  } catch (err) {
    logApiError('PATCH /api/deposits', err);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
