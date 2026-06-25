import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getGuestProfile360, searchGuestProfiles } from '@/lib/server/guest-profile';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const mode = url.searchParams.get('mode') ?? 'profile';
  const propertyId = propertyIdFromRequest(req);

  if (mode === 'search') {
    const results = await searchGuestProfiles(q, propertyId);
    return NextResponse.json({ ok: true, results });
  }

  const profile = await getGuestProfile360(q, propertyId);
  if (!profile) {
    return NextResponse.json({ ok: false, message: 'Misafir bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile });
}
