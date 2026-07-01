import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { listRoomServiceOrders, updateRoomServiceOrderStatus } from '@/lib/integrations/room-service/client';
import { ROOM_SERVICE_ORDER_STATUSES, type RoomServiceOrderStatus } from '@/lib/integrations/room-service/types';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

const STATUSES = new Set<RoomServiceOrderStatus>(ROOM_SERVICE_ORDER_STATUSES.map((s) => s.id));

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  try {
    const orders = await listRoomServiceOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    logApiError('GET /api/room-service/orders', err);
    return NextResponse.json({ error: 'orders fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'identity.notify');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { id?: string; status?: RoomServiceOrderStatus };
  if (!body.id || !body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'id ve geçerli status gerekli' }, { status: 400 });
  }

  try {
    const result = await updateRoomServiceOrderStatus(body.id, body.status);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    logApiError('POST /api/room-service/orders', err);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
