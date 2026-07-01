import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { scanIdDocument } from '@/lib/integrations/id-reader/client';
import { scanIdDocumentFromImage } from '@/lib/integrations/id-reader/image-scan';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as {
    deviceId?: string;
    reservationId?: string;
    imageBase64?: string;
  };

  // Image-based path: local OCR + MRZ fallback (no hardware reader). The
  // image lives only in this request's memory — see image-scan.ts for the
  // full no-disk/no-DB privacy guarantee. It is never echoed back below.
  if (body.imageBase64) {
    const result = await scanIdDocumentFromImage(body.imageBase64, body.reservationId);
    return NextResponse.json(result);
  }

  return NextResponse.json(await scanIdDocument(body.deviceId, body.reservationId));
}
