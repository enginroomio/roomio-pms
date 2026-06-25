import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import {
  loadProcurementConfig,
  saveProcurementConfig,
  listPurchaseRequests,
} from '@/lib/integrations/procurement/client';
import type { ProcurementConfig } from '@/lib/integrations/procurement/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  if (searchParams.get('requests') === '1') {
    return NextResponse.json({ ok: true, requests: await listPurchaseRequests() });
  }

  return NextResponse.json(await loadProcurementConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  await saveProcurementConfig((await req.json()) as ProcurementConfig);
  return NextResponse.json({ ok: true });
}
