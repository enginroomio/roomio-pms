import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { scanIdDocument } from '@/lib/integrations/id-reader/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as { deviceId?: string; reservationId?: string };
  return NextResponse.json(await scanIdDocument(body.deviceId, body.reservationId));
}
