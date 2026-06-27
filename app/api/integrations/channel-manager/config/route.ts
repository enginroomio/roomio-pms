import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadChannelManagerConfig, saveChannelManagerConfig } from '@/lib/integrations/channel-manager/client';
import type { ChannelManagerConfig } from '@/lib/integrations/channel-manager/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await loadChannelManagerConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as ChannelManagerConfig;
  await saveChannelManagerConfig(body);
  return NextResponse.json({ ok: true });
}
