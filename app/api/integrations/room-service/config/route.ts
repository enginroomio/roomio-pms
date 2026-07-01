import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadRoomServiceConfig, saveRoomServiceConfig } from '@/lib/integrations/room-service/client';
import type { RoomServiceConfig } from '@/lib/integrations/room-service/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadRoomServiceConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveRoomServiceConfig((await req.json()) as RoomServiceConfig);
  return NextResponse.json({ ok: true });
}
