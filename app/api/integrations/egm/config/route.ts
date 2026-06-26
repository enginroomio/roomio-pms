import { NextResponse } from 'next/server';
import { requireIntegrationIdentityRead } from '@/lib/auth/require-permission';
import { loadEgmConfig } from '@/lib/integrations/egm/client';

export const dynamic = 'force-dynamic';

type StoredConfig = {
  enabled?: boolean;
  gatewayUrl?: string;
  facilityCode?: string;
  autoSubmitOnCheckIn?: boolean;
  simulateWhenOffline?: boolean;
};

const memoryStore: { config: StoredConfig | null } = { config: null };

function mergeConfig(stored: StoredConfig | null) {
  const env = loadEgmConfig();
  return {
    enabled: stored?.enabled ?? true,
    gatewayUrl: stored?.gatewayUrl ?? env.gatewayUrl,
    facilityCode: stored?.facilityCode ?? env.facilityCode,
    autoSubmitOnCheckIn: stored?.autoSubmitOnCheckIn ?? false,
    simulateWhenOffline: stored?.simulateWhenOffline ?? env.simulateWhenOffline,
  };
}

export async function GET(req: Request) {
  const auth = await requireIntegrationIdentityRead(req);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(mergeConfig(memoryStore.config));
}

export async function POST(req: Request) {
  const auth = await requireIntegrationIdentityRead(req);
  if (auth instanceof NextResponse) return auth;
  const body = (await req.json()) as StoredConfig;
  memoryStore.config = { ...memoryStore.config, ...body };
  return NextResponse.json({ ok: true, ...mergeConfig(memoryStore.config) });
}
