import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead, requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { calculateLoyaltyPoints, loadLoyaltyConfig, saveLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import type { LoyaltyConfig } from '@/lib/integrations/loyalty/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadLoyaltyConfig());
}

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const body = (await req.json()) as LoyaltyConfig | { nights?: number; spendTry?: number; agencyCode?: string };

  if (searchParams.get('calculate') === '1') {
    const config = await loadLoyaltyConfig();
    const calc = calculateLoyaltyPoints(config, {
      nights: Number((body as { nights?: number }).nights ?? 0),
      spendTry: Number((body as { spendTry?: number }).spendTry ?? 0),
      agencyCode: (body as { agencyCode?: string }).agencyCode,
    });
    return NextResponse.json({ ok: true, ...calc });
  }

  await saveLoyaltyConfig(body as LoyaltyConfig);
  return NextResponse.json({ ok: true });
}
