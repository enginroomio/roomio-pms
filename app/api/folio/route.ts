import { NextResponse } from 'next/server';
import {
  getFolioBalancesServer,
  getFolioLinesServer,
  postFolioChargeServer,
  postFolioPaymentServer,
} from '@/lib/server/folio-cash';
import { issueCompanyFolioInvoice } from '@/lib/server/company-billing';
import { postExtraChargesToFolioServer } from '@/lib/server/extra-charge-folio';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getAllReservationsServer } from '@/lib/server/pms-store';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { isValidPositiveAmount } from '@/lib/server/money-validation';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'cash.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservationId');
  const idsParam = searchParams.get('ids');
  const window = searchParams.get('window') as 'guest' | 'company' | null;
  const split = searchParams.get('split') === '1';

  try {
    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      const balances = await getFolioBalancesServer(ids, propertyId);
      return NextResponse.json({ balances });
    }

    if (!reservationId) {
      return NextResponse.json({ error: 'reservationId veya ids gerekli' }, { status: 400 });
    }

    if (split) {
      const [guestLines, companyLines] = await Promise.all([
        getFolioLinesServer(reservationId, propertyId, 'guest'),
        getFolioLinesServer(reservationId, propertyId, 'company'),
      ]);
      const bal = (lines: typeof guestLines) => lines.reduce((s, l) => s + (l.type === 'payment' ? -l.amount : l.amount), 0);
      return NextResponse.json({
        reservationId,
        guest: { lines: guestLines, balance: bal(guestLines) },
        company: { lines: companyLines, balance: bal(companyLines) },
      });
    }

    const lines = await getFolioLinesServer(reservationId, propertyId, window ?? undefined);
    const balance = lines.reduce((s, l) => s + (l.type === 'payment' ? -l.amount : l.amount), 0);
    return NextResponse.json({ reservationId, lines, balance, window: window ?? 'all' });
  } catch (err) {
    logApiError('GET /api/folio', err);
    return NextResponse.json({ error: 'folio fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const auth = await requireApiPermission(req, 'cash.write');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body = (await req.json()) as {
    action?: 'payment' | 'charge' | 'company_invoice' | 'extra_charges';
    reservationId?: string;
    amount?: number;
    register?: string;
    user?: string;
    description?: string;
    window?: 'guest' | 'company';
    extraChargeCodes?: string[];
  };

  const isExtraCharges = body.action === 'extra_charges';

  if (!body.reservationId) {
    return NextResponse.json({ error: 'reservationId gerekli' }, { status: 400 });
  }

  if (!isExtraCharges && !isValidPositiveAmount(body.amount)) {
    return NextResponse.json({ error: 'reservationId ve amount gerekli' }, { status: 400 });
  }

  const isCharge = body.action === 'charge';
  const isCompanyInvoice = body.action === 'company_invoice';

  try {
    if (isExtraCharges) {
      const codes = body.extraChargeCodes ?? [];
      if (!codes.length) {
        return NextResponse.json({ error: 'extraChargeCodes gerekli' }, { status: 400 });
      }
      const reservations = await getAllReservationsServer(propertyId);
      const reservation = reservations.find((r) => r.id === body.reservationId);
      if (!reservation) {
        return NextResponse.json({ error: 'rezervasyon bulunamadı' }, { status: 404 });
      }
      const lines = await postExtraChargesToFolioServer(
        body.reservationId,
        codes,
        reservation,
        propertyId,
        body.user ?? user.name,
      );
      return NextResponse.json({ ok: true, lines });
    }

    if (isCompanyInvoice) {
      if (!body.reservationId) {
        return NextResponse.json({ error: 'reservationId gerekli' }, { status: 400 });
      }
      const result = await issueCompanyFolioInvoice(body.reservationId, {
        user: body.user ?? user.name,
        propertyId,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (isCharge) {
      if (!body.description?.trim() || !isValidPositiveAmount(body.amount)) {
        return NextResponse.json({ error: 'Harcama için description ve amount gerekli' }, { status: 400 });
      }
      const lines = await postFolioChargeServer(
        body.reservationId,
        body.amount,
        body.description.trim(),
        propertyId,
        body.window ?? 'guest',
      );
      return NextResponse.json({ ok: true, lines });
    }

    if (!isValidPositiveAmount(body.amount)) {
      return NextResponse.json({ error: 'amount gerekli' }, { status: 400 });
    }

    const result = await postFolioPaymentServer(body.reservationId, body.amount, {
      register: body.register,
      user: body.user ?? user.name,
      description: body.description,
      propertyId,
      window: body.window ?? 'guest',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logApiError('POST /api/folio', err);
    return NextResponse.json({ error: isCharge ? 'charge failed' : 'payment failed' }, { status: 500 });
  }
}
