import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getHotelSeasonsServer, saveHotelSeasonServer } from '@/lib/server/hotel-seasons';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const seasons = await getHotelSeasonsServer(propertyId);
    return NextResponse.json({ ok: true, seasons });
  } catch {
    return NextResponse.json({ error: 'hotel seasons fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    start?: string;
    end?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || !body.start || !body.end) {
    return NextResponse.json({ error: 'code, name, start, end gerekli' }, { status: 400 });
  }
  try {
    const season = await saveHotelSeasonServer({
      code: body.code,
      name: body.name,
      start: body.start,
      end: body.end,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, season });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
