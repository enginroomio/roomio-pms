import { NextResponse } from 'next/server';
import {
  assignQueueRoom,
  cancelQueueRoom,
  enqueueQueueRoom,
  ensureDemoQueueRoomsSeeded,
  listQueueRooms,
  markQueueRoomReady,
} from '@/lib/server/queue-rooms-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  await ensureDemoQueueRoomsSeeded(propertyId);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'waiting' | 'ready' | 'assigned' | 'cancelled' | 'active' | null;
  const entries = await listQueueRooms(propertyId, { status: status ?? 'active' });
  return NextResponse.json({ count: entries.length, entries });
}

export async function POST(request: Request) {
  const auth = await requireApiPermission(request, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const body = (await request.json()) as {
    action?: 'enqueue' | 'ready' | 'assign' | 'cancel';
    id?: string;
    guestName?: string;
    roomType?: string;
    adults?: number;
    reservationId?: string;
    refNo?: string;
    email?: string;
    phone?: string;
    priority?: 'normal' | 'vip' | 'urgent';
    notes?: string;
    roomNo?: string;
  };

  if (body.action === 'ready' && body.id) {
    const entry = await markQueueRoomReady(body.id, propertyId);
    return NextResponse.json({ ok: true, entry });
  }
  if (body.action === 'assign' && body.id && body.roomNo) {
    const entry = await assignQueueRoom(body.id, body.roomNo, propertyId);
    return NextResponse.json({ ok: true, entry });
  }
  if (body.action === 'cancel' && body.id) {
    const entry = await cancelQueueRoom(body.id, propertyId);
    return NextResponse.json({ ok: true, entry });
  }

  if (!body.guestName || !body.roomType) {
    return NextResponse.json({ error: 'guestName ve roomType gerekli' }, { status: 400 });
  }

  const entry = await enqueueQueueRoom({
    guestName: body.guestName,
    roomType: body.roomType,
    adults: body.adults,
    reservationId: body.reservationId,
    refNo: body.refNo,
    email: body.email,
    phone: body.phone,
    priority: body.priority,
    notes: body.notes,
    propertyId,
  });
  return NextResponse.json({ ok: true, entry });
}
