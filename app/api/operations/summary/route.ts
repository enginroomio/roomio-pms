import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { getOperationsSummaryServer } from '@/lib/server/operations-summary';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const summary = await getOperationsSummaryServer(propertyId);
    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json({ error: 'operations summary failed' }, { status: 500 });
  }
}
