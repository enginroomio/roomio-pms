import { NextResponse } from 'next/server';
import { getTaxRules, saveTaxRules } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { TaxRule } from '@/lib/tax/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const rules = await getTaxRules(propertyId);
  return NextResponse.json({ ok: true, rules });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as { rules?: TaxRule[] };
    if (!body.rules?.length) {
      return NextResponse.json({ error: 'rules required' }, { status: 400 });
    }
    const saved = await saveTaxRules(body.rules, propertyId);
    return NextResponse.json({ ok: true, rules: saved });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
