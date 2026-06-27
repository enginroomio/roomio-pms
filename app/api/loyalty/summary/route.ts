import { NextResponse } from 'next/server';
import { requireApiAnyPermission } from '@/lib/auth/require-permission';
import { ensureDemoLoyaltySeeded, getLoyaltySummary } from '@/lib/loyalty/service';
import { loadLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireApiAnyPermission(request, ['reports.export', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  await ensureDemoLoyaltySeeded(propertyId);
  const [summary, config] = await Promise.all([
    getLoyaltySummary(propertyId),
    loadLoyaltyConfig(),
  ]);
  return NextResponse.json({ ok: true, summary, config });
}
