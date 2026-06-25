import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadDynamicPricingConfig, saveDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import type { DynamicPricingConfig } from '@/lib/dynamic-pricing/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadDynamicPricingConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as DynamicPricingConfig;
  await saveDynamicPricingConfig(body);
  return NextResponse.json({ ok: true });
}
