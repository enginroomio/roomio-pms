import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { runNightAuditPreCloseChecks } from '@/lib/server/night-audit-checks';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'eod.close');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const result = await runNightAuditPreCloseChecks(propertyId);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: 'pre-close check failed' }, { status: 500 });
  }
}
