import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { applyDynamicPricing } from '@/lib/dynamic-pricing/engine';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const days = Math.min(31, Math.max(1, Number(searchParams.get('days') ?? 14)));
  const propertyId = propertyIdFromRequest(req);
  const result = await applyDynamicPricing(propertyId, days);
  return NextResponse.json(result);
}
