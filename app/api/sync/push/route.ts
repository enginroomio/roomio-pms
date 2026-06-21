import { NextResponse } from 'next/server';
import { appendSyncItems } from '@/lib/server/local-store';
import { updateHkRoom } from '@/lib/server/housekeeping-service';
import type { SyncPushRequest } from '@/lib/sync/types';
import type { RoomHkStatus } from '@/lib/types/room';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SyncPushRequest;
    if (!body.deviceId || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    for (const item of body.items) {
      if (item.entity !== 'housekeeping' || item.operation !== 'update') continue;
      const payload = item.payload as { roomNo?: string; hkStatus?: RoomHkStatus };
      if (payload.roomNo && payload.hkStatus) {
        await updateHkRoom(payload.roomNo, { hkStatus: payload.hkStatus });
      }
    }

    const accepted = await appendSyncItems(body.items);
    return NextResponse.json({ ok: true, accepted, serverTime: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: 'push failed' }, { status: 500 });
  }
}
