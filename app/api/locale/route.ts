import { NextResponse } from 'next/server';
import { getLocaleMessages } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const url = new URL(req.url);
  const locale = url.searchParams.get('locale') ?? 'tr';
  const messages = await getLocaleMessages(propertyId, locale);
  return NextResponse.json({ ok: true, locale, messages });
}
