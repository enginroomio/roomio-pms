import { NextResponse } from 'next/server';
import { createOnlineBooking } from '@/lib/booking-engine/service';
import type { OnlineBookingRequest } from '@/lib/booking-engine/types';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as OnlineBookingRequest & { propertyId?: string };
  const result = await createOnlineBooking(body, body.propertyId ?? DEFAULT_PROPERTY_ID);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
