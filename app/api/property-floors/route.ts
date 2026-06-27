import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getPropertyFloorsServer, savePropertyFloorServer } from '@/lib/server/property-room-inventory';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const floors = await getPropertyFloorsServer(propertyId);
    return NextResponse.json({ ok: true, floors });
  } catch (err) {
    logApiError('GET /api/property-floors', err);
    return NextResponse.json({ error: 'floors fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    id?: string;
    floor?: number;
    start?: number;
    end?: number;
    active?: boolean;
  };
  if (body.floor == null || body.start == null || body.end == null) {
    return NextResponse.json({ error: 'floor, start, end gerekli' }, { status: 400 });
  }
  try {
    const floor = await savePropertyFloorServer({
      id: body.id,
      floor: body.floor,
      start: body.start,
      end: body.end,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, floor });
  } catch (err) {
    logApiError('POST /api/property-floors', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
