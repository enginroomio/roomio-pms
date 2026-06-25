import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadInventoryConfig, saveInventoryConfig } from '@/lib/integrations/inventory/client';
import type { InventoryConfig } from '@/lib/integrations/inventory/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadInventoryConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveInventoryConfig((await req.json()) as InventoryConfig);
  return NextResponse.json({ ok: true });
}
