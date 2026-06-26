import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getIdReaderPublicConfig } from '@/lib/integrations/id-reader/client';

export const dynamic = 'force-dynamic';

/** Check-in ekranı için kimlik okuyucu politika ayarları (cihaz detayı yok). */
export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await getIdReaderPublicConfig());
}
