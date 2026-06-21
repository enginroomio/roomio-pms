import { NextResponse } from 'next/server';
import { getHousekeepingBoardServer, updateHkRoom } from '@/lib/server/housekeeping-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { RoomHkStatus } from '@/lib/types/room';

export async function GET(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const rooms = await getHousekeepingBoardServer(propertyId);
  return NextResponse.json({ count: rooms.length, rooms });
}

export async function PATCH(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const body = await request.json() as {
    roomNo?: string;
    hkStatus?: RoomHkStatus;
    assignedTo?: string;
    notes?: string;
  };
  if (!body.roomNo) {
    return NextResponse.json({ error: 'roomNo gerekli' }, { status: 400 });
  }
  const room = await updateHkRoom(body.roomNo, body, propertyId);
  return NextResponse.json({ room });
}
