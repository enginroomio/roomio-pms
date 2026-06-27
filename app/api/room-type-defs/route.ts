import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getRoomTypeDefsServer, saveRoomTypeDefServer } from '@/lib/server/property-room-inventory';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const types = await getRoomTypeDefsServer(propertyId);
    return NextResponse.json({ ok: true, types });
  } catch (err) {
    logApiError('GET /api/room-type-defs', err);
    return NextResponse.json({ error: 'room types fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    short?: string;
    name?: string;
    bedType?: string;
    maxPersons?: number;
    maxAdults?: number;
    maxChildren?: number;
    baseRate?: number;
    location?: string;
    description?: string;
    active?: boolean;
  };
  if (!body.code || !body.short || !body.name || !body.bedType || body.baseRate == null) {
    return NextResponse.json({ error: 'code, short, name, bedType, baseRate gerekli' }, { status: 400 });
  }
  try {
    const type = await saveRoomTypeDefServer({
      code: body.code,
      short: body.short,
      name: body.name,
      bedType: body.bedType,
      maxPersons: body.maxPersons ?? 2,
      maxAdults: body.maxAdults ?? 2,
      maxChildren: body.maxChildren ?? 0,
      baseRate: body.baseRate,
      location: body.location,
      description: body.description,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, type });
  } catch (err) {
    logApiError('POST /api/room-type-defs', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
