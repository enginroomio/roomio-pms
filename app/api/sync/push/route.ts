import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { appendSyncItems } from '@/lib/server/local-store';
import { createGuestRequest } from '@/lib/server/guest-request-service';
import { saveGuestTraceServer } from '@/lib/server/guest-traces';
import { updateHkRoom } from '@/lib/server/housekeeping-service';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import type { SyncPushRequest } from '@/lib/sync/types';
import type { RoomHkStatus } from '@/lib/types/room';

export async function POST(req: Request) {
  const auth = await requireApiAnyPermission(req, ['hk.manage', 'reception.checkin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);

  try {
    const body = (await req.json()) as SyncPushRequest;
    if (!body.deviceId || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    for (const item of body.items) {
      if (item.entity === 'housekeeping' && item.operation === 'update') {
        const payload = item.payload as { roomNo?: string; hkStatus?: RoomHkStatus };
        if (payload.roomNo && payload.hkStatus) {
          await updateHkRoom(payload.roomNo, { hkStatus: payload.hkStatus });
        }
      }
      if (item.entity === 'guest_request' && item.operation === 'create') {
        const payload = item.payload as {
          roomNo?: string;
          requestType?: string;
          description?: string;
          requestedBy?: string;
        };
        if (payload.roomNo && payload.requestType) {
          await createGuestRequest({
            roomNo: payload.roomNo,
            requestType: payload.requestType,
            description: payload.description,
            requestedBy: payload.requestedBy,
            propertyId,
          });
        }
      }
      if (item.entity === 'guest_trace' && item.operation === 'create') {
        const payload = item.payload as {
          id?: string;
          guest?: string;
          roomNo?: string;
          subject?: string;
          due?: string;
          assignee?: string;
          date?: string;
          status?: 'Açık' | 'Tamamlandı';
          notes?: string;
        };
        if (payload.guest && payload.roomNo && payload.subject && payload.due && payload.assignee) {
          await saveGuestTraceServer({
            id: payload.id,
            date: payload.date ?? new Date().toISOString().slice(0, 10),
            guest: payload.guest,
            roomNo: payload.roomNo,
            subject: payload.subject,
            due: payload.due,
            status: payload.status ?? 'Açık',
            assignee: payload.assignee,
            notes: payload.notes,
          }, propertyId);
        }
      }
    }

    const accepted = await appendSyncItems(body.items);
    return NextResponse.json({ ok: true, accepted, serverTime: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'push failed' }, { status: 500 });
  }
}
