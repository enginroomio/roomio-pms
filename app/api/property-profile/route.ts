import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getPropertyProfileServer, savePropertyProfileServer } from '@/lib/server/property-profile';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const profile = await getPropertyProfileServer(propertyId);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logApiError('GET /api/property-profile', err);
    return NextResponse.json({ error: 'property profile fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as Partial<{
    name: string;
    code: string;
    company: string;
    taxOffice: string;
    taxNumber: string;
    address: string;
    phone: string;
    email: string;
    stars: number;
    checkInTime: string;
    checkOutTime: string;
    currency: string;
    user: string;
  }>;
  try {
    const profile = await savePropertyProfileServer(body, propertyId, body.user ?? 'Kuruluş');
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logApiError('POST /api/property-profile', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
