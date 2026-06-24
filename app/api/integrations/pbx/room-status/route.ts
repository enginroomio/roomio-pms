import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { pbxUpdateRoomStatus } from '@/lib/integrations/pbx/client';
import type { UcmRoomStatus } from '@/lib/integrations/pbx/types';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reception.checkin');
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { roomNo: string; status: UcmRoomStatus };
  const result = await pbxUpdateRoomStatus(body.roomNo, body.status);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
