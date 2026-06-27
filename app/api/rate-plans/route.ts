import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import {
  getRateCalendarServer,
  upsertCalendarRate,
} from '@/lib/server/rate-calendar';
import { getRatePlansServer, resolveRatePlanQuote, saveRatePlanServer } from '@/lib/server/rate-plans';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const code = searchParams.get('code');
  const roomType = searchParams.get('roomType');
  const checkIn = searchParams.get('checkIn');

  try {
    if (view === 'calendar') {
      const from = searchParams.get('from') ?? new Date().toISOString().slice(0, 10);
      const to = searchParams.get('to') ?? addDays(from, 13);
      const calendar = await getRateCalendarServer(from, to, {
        code: code ?? undefined,
        roomType: roomType ?? undefined,
        propertyId,
      });
      return NextResponse.json({ ok: true, from, to, calendar });
    }

    if (code && roomType && checkIn) {
      const quote = await resolveRatePlanQuote(code, roomType, checkIn, propertyId);
      return NextResponse.json({ ok: true, quote });
    }
    const plans = await getRatePlansServer(propertyId, searchParams.get('all') !== '1');
    return NextResponse.json({ ok: true, plans });
  } catch (err) {
    logApiError('GET /api/rate-plans', err);
    return NextResponse.json({ error: 'rate plans fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    action?: 'calendar';
    code?: string;
    name?: string;
    market?: string;
    roomType?: string;
    baseRate?: number;
    currency?: string;
    mealPlan?: string;
    active?: boolean;
    date?: string;
    rate?: number;
  };

  try {
    if (body.action === 'calendar') {
      if (!body.code || !body.date || body.rate == null) {
        return NextResponse.json({ error: 'code, date, rate gerekli' }, { status: 400 });
      }
      const cell = await upsertCalendarRate({
        date: body.date,
        ratePlanCode: body.code,
        roomType: body.roomType,
        rate: body.rate,
        currency: body.currency ?? 'TRY',
      }, propertyId);
      return NextResponse.json({ ok: true, cell });
    }

    if (!body.code || !body.name || body.baseRate == null) {
      return NextResponse.json({ error: 'code, name, baseRate gerekli' }, { status: 400 });
    }
    const plan = await saveRatePlanServer({
      code: body.code,
      name: body.name,
      market: body.market ?? 'BAR',
      roomType: body.roomType,
      baseRate: body.baseRate,
      currency: body.currency ?? 'TRY',
      mealPlan: body.mealPlan,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    logApiError('POST /api/rate-plans', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
