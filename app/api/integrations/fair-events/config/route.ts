import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadFairEventsConfig, saveFairEventsConfig } from '@/lib/integrations/fair-events/client';
import type { FairEventsConfig } from '@/lib/integrations/fair-events/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadFairEventsConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveFairEventsConfig((await req.json()) as FairEventsConfig);
  return NextResponse.json({ ok: true });
}
