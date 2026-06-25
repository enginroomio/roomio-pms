import { NextResponse } from 'next/server';
import { loadKioskConfig } from '@/lib/kiosk/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await loadKioskConfig();
  return NextResponse.json({
    enabled: config.enabled,
    hotelName: config.hotelName,
    languages: config.languages,
    allowIdScan: config.allowIdScan,
    printRoomKey: config.printRoomKey,
  });
}
