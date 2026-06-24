import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/require-permission';
import { getWeatherServer } from '@/lib/server/weather';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const weather = await getWeatherServer(propertyId);
    return NextResponse.json({ ok: true, ...weather });
  } catch {
    return NextResponse.json({ error: 'weather fetch failed' }, { status: 500 });
  }
}
