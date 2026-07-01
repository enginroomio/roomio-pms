import { NextResponse } from 'next/server';
import { loadGuestPortalConfig } from '@/lib/guest-portal/client';

export const dynamic = 'force-dynamic';

/**
 * Misafir tarafındaki herkese açık sayfalar (/guest, /book) hangi hizmet
 * bağlantılarının görüneceğini buradan okur. Admin-auth gerektiren
 * /api/guest-portal/config'in aksine bu uç nokta token gerektirmez —
 * sadece açık/kapalı bayrakları döner, PII içermez.
 */
export async function GET() {
  const config = await loadGuestPortalConfig();
  return NextResponse.json({ ok: true, serviceLinks: config.serviceLinks });
}
