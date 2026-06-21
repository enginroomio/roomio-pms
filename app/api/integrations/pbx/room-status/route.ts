import { NextResponse } from 'next/server';
import { pbxUpdateRoomStatus } from '@/lib/integrations/pbx/client';
import type { UcmRoomStatus } from '@/lib/integrations/pbx/types';

export async function POST(req: Request) {
  const body = (await req.json()) as { roomNo: string; status: UcmRoomStatus };
  const result = await pbxUpdateRoomStatus(body.roomNo, body.status);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
