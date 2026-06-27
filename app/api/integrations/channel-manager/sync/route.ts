import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { loadChannelManagerConfig, syncChannelManager, testChannelManagerConnection } from '@/lib/integrations/channel-manager/client';
import { loadDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import { applyDynamicPricing } from '@/lib/dynamic-pricing/engine';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const testOnly = url.searchParams.get('test') === '1';
  const config = await loadChannelManagerConfig();

  if (!testOnly) {
    const pricing = await loadDynamicPricingConfig();
    if (pricing.enabled && pricing.autoApplyOnSync) {
      await applyDynamicPricing(propertyIdFromRequest(req));
    }
  }

  const result = testOnly
    ? await testChannelManagerConnection(config)
    : await syncChannelManager(config, propertyIdFromRequest(req));

  return NextResponse.json(result);
}
