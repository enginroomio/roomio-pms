import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getRepeatGuestsReportServer } from '@/lib/server/repeat-guests';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const guests = await getRepeatGuestsReportServer(propertyId);
    return NextResponse.json({ ok: true, guests });
  } catch {
    return NextResponse.json({ error: 'repeat-guests fetch failed' }, { status: 500 });
  }
}
