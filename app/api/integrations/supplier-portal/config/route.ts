import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadSupplierPortalConfig, saveSupplierPortalConfig } from '@/lib/integrations/supplier-portal/client';
import type { SupplierPortalConfig } from '@/lib/integrations/supplier-portal/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadSupplierPortalConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveSupplierPortalConfig((await req.json()) as SupplierPortalConfig);
  return NextResponse.json({ ok: true });
}
