import { NextResponse } from 'next/server';
import { getBookingAvailability } from '@/lib/booking-engine/service';
import { loadBookingEngineConfig } from '@/lib/booking-engine/client';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const config = await loadBookingEngineConfig();
  if (!config.enabled) {
    return NextResponse.json({ ok: false, message: 'Online rezervasyon kapalı' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const propertyId = searchParams.get('propertyId') ?? DEFAULT_PROPERTY_ID;

  if (!checkIn || !checkOut) {
    return NextResponse.json({ ok: false, message: 'checkIn ve checkOut gerekli' }, { status: 400 });
  }

  const result = await getBookingAvailability(checkIn, checkOut, propertyId);
  return NextResponse.json({
    ok: result.ok,
    hotelName: config.hotelName,
    headline: config.headline,
    currency: config.currency,
    mealPlan: config.defaultMealPlan,
    allowVirtualPos: config.allowVirtualPos,
    requirePrepayment: config.requirePrepayment,
    days: result.days,
    message: result.message,
  });
}
