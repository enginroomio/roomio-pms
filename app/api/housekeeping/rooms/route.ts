import { NextResponse } from 'next/server';
import { completeFaultForRoom, createRoomFault } from '@/lib/server/fault-service';
import { getHousekeepingBoardServer, updateHkRoom } from '@/lib/server/housekeeping-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';
import type { RoomHkStatus } from '@/lib/types/room';

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const rooms = await getHousekeepingBoardServer(propertyId);
  return NextResponse.json({ count: rooms.length, rooms });
}

export async function PATCH(request: Request) {
  const propertyId = propertyIdFromRequest(request);
  const auth = await requireApiPermission(request, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

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

  if (body.hkStatus === 'OOO') {
    await createRoomFault({
      roomNo: body.roomNo,
      description: body.notes,
      reportedBy: 'HK',
      propertyId,
      skipHkUpdate: true,
    });
  } else if (body.hkStatus === 'CLEAN') {
    await completeFaultForRoom(body.roomNo, 'HK', propertyId);
  }

  return NextResponse.json({ room });
}
