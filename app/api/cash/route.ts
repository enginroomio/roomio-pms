import { NextResponse } from 'next/server';
import {
  cashSummaryServer,
  closeCashRegisterServer,
  getCashEntriesServer,
  getCashRegistersServer,
  transferCashBetweenRegistersServer,
} from '@/lib/server/folio-cash';
import { getCashCloseReportServer } from '@/lib/server/cash-deposit';
import { getCashLedgerReportServer, postManualCashEntryServer } from '@/lib/server/reception-ops';
import { buildCashClosePdfKit, buildCashLedgerPdfKit } from '@/lib/server/pdf-templates';
import { getProperty, getBusinessDate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { isValidPositiveAmount } from '@/lib/server/money-validation';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'cash.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const format = searchParams.get('format');
  const businessDate = searchParams.get('businessDate') ?? undefined;

  try {
    if (view === 'ledger') {
      const report = await getCashLedgerReportServer(propertyId, businessDate ?? undefined);
      if (format === 'pdf') {
        const hotel = (await getProperty(propertyId))?.name ?? 'Hotel';
        const pdf = await buildCashLedgerPdfKit(report, hotel);
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="kasa-defteri-${report.businessDate}.pdf"`,
          },
        });
      }
      return NextResponse.json({ ok: true, report });
    }

    if (view === 'close-report') {
      const report = await getCashCloseReportServer(propertyId);
      if (format === 'pdf') {
        const pdf = await buildCashClosePdfKit(report);
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="kasa-kapanis-${report.businessDate}.pdf"`,
          },
        });
      }
      return NextResponse.json({ ok: true, report });
    }

    if (view === 'registers') {
      const registers = await getCashRegistersServer(propertyId);
      return NextResponse.json({ registers });
    }

    const resolvedDate = businessDate ?? (await getBusinessDate(propertyId));
    const [entries, summary] = await Promise.all([
      getCashEntriesServer(propertyId, resolvedDate),
      cashSummaryServer(propertyId),
    ]);
    return NextResponse.json({ entries, summary, businessDate: resolvedDate });
  } catch (err) {
    logApiError('GET /api/cash', err);
    return NextResponse.json({ error: 'cash fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'cash.write');
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const propertyId = propertyIdFromRequest(req);

  const body = (await req.json()) as {
    action?: 'close' | 'transfer' | 'manual_entry';
    registerId?: string;
    countedBalance?: number;
    fromRegister?: string;
    toRegister?: string;
    amount?: number;
    user?: string;
    register?: string;
    type?: 'odeme' | 'avans' | 'doviz' | 'tahsilat';
    description?: string;
    currency?: string;
  };

  try {
    if (body.action === 'manual_entry') {
      if (!isValidPositiveAmount(body.amount) || !body.description?.trim() || !body.type) {
        return NextResponse.json({ error: 'type, amount, description gerekli' }, { status: 400 });
      }
      const entry = await postManualCashEntryServer({
        register: body.register,
        type: body.type,
        amount: body.amount,
        description: body.description.trim(),
        user: body.user ?? user.name,
        currency: body.currency,
      }, propertyId);
      return NextResponse.json({ ok: true, entry });
    }

    if (body.action === 'close') {
      if (!body.registerId || body.countedBalance == null || body.countedBalance < 0) {
        return NextResponse.json({ error: 'registerId ve countedBalance gerekli' }, { status: 400 });
      }
      const register = await closeCashRegisterServer(
        body.registerId,
        body.countedBalance,
        body.user ?? user.name,
        propertyId,
      );
      return NextResponse.json({ ok: true, register });
    }

    if (body.action === 'transfer') {
      if (!body.fromRegister || !body.toRegister || !isValidPositiveAmount(body.amount)) {
        return NextResponse.json({ error: 'fromRegister, toRegister ve amount gerekli' }, { status: 400 });
      }
      const result = await transferCashBetweenRegistersServer(
        body.fromRegister,
        body.toRegister,
        body.amount,
        body.user ?? user.name,
        propertyId,
      );
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  } catch (err) {
    logApiError('POST /api/cash', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'cash operation failed' },
      { status: 500 },
    );
  }
}
