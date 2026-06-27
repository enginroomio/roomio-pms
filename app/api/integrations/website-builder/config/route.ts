import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadWebsiteBuilderConfig, saveWebsiteBuilderConfig } from '@/lib/integrations/website-builder/client';
import type { WebsiteBuilderConfig } from '@/lib/integrations/website-builder/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadWebsiteBuilderConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveWebsiteBuilderConfig((await req.json()) as WebsiteBuilderConfig);
  return NextResponse.json({ ok: true });
}
