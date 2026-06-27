import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getTaxRules, saveTaxRules } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { TaxRule } from '@/lib/tax/types';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const rules = await getTaxRules(propertyId);
  return NextResponse.json({ ok: true, rules });
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as { rules?: TaxRule[] };
    if (!body.rules?.length) {
      return NextResponse.json({ error: 'rules required' }, { status: 400 });
    }
    const saved = await saveTaxRules(body.rules, propertyId);
    return NextResponse.json({ ok: true, rules: saved });
  } catch (err) {
    logApiError('POST /api/tax/rules', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
