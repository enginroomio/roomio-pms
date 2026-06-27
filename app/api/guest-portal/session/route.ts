import { NextResponse } from 'next/server';
import { lookupGuestSession } from '@/lib/guest-portal/session';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    refNo?: string;
    email?: string;
    propertyId?: string;
  };
  const session = await lookupGuestSession({
    ...body,
    propertyId: body.propertyId ?? DEFAULT_PROPERTY_ID,
  });
  if (!session.ok) {
    return NextResponse.json(session, { status: 404 });
  }
  return NextResponse.json(session);
}
