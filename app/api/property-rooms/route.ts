import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import {
  countPropertyRoomsServer,
  getPropertyRoomsServer,
  savePropertyRoomServer,
} from '@/lib/server/property-room-inventory';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? 80);
  try {
    const [rooms, total] = await Promise.all([
      getPropertyRoomsServer(propertyId, limit),
      countPropertyRoomsServer(propertyId),
    ]);
    return NextResponse.json({ ok: true, rooms, total });
  } catch {
    return NextResponse.json({ error: 'rooms fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    roomNo?: string;
    floor?: number;
    typeCode?: string;
    location?: string;
    building?: string;
    isActive?: boolean;
  };
  if (!body.roomNo || body.floor == null || !body.typeCode) {
    return NextResponse.json({ error: 'roomNo, floor, typeCode gerekli' }, { status: 400 });
  }
  try {
    const room = await savePropertyRoomServer({
      roomNo: body.roomNo,
      floor: body.floor,
      typeCode: body.typeCode,
      location: body.location,
      building: body.building ?? 'Ana Bina',
      isActive: body.isActive ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, room });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
