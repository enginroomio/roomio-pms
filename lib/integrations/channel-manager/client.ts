import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  CHANNEL_CATALOG,
  DEFAULT_CHANNEL_MANAGER_CONFIG,
  type ChannelConnectionStatus,
  type ChannelManagerConfig,
  type ChannelSyncResult,
} from '@/lib/integrations/channel-manager/types';
import { channelStatus, runChannelSync, testChannelManagerLive } from '@/lib/integrations/channel-manager/live-sync';

const FILE = 'channel-manager-config.json';

function mergeChannels(saved: ChannelManagerConfig): ChannelManagerConfig['channels'] {
  const byId = new Map(saved.channels.map((c) => [c.channelId, c]));
  return CHANNEL_CATALOG.map((entry) => {
    const existing = byId.get(entry.id);
    if (existing) return existing;
    return {
      channelId: entry.id,
      enabled: false,
      propertyId: '',
      apiKey: '',
      pushRates: true,
      pushAvailability: true,
      pullReservations: true,
    };
  });
}

export async function loadChannelManagerConfig(): Promise<ChannelManagerConfig> {
  const parsed = await loadJsonConfig(FILE, DEFAULT_CHANNEL_MANAGER_CONFIG);
  return { ...parsed, channels: mergeChannels(parsed) };
}

export async function saveChannelManagerConfig(config: ChannelManagerConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testChannelManagerConnection(
  config = DEFAULT_CHANNEL_MANAGER_CONFIG,
): Promise<ChannelSyncResult> {
  return testChannelManagerLive(config);
}

export async function syncChannelManager(
  config = DEFAULT_CHANNEL_MANAGER_CONFIG,
  propertyId?: string,
): Promise<ChannelSyncResult> {
  return runChannelSync(config, propertyId, { testOnly: false });
}

export function summarizeChannelConnection(
  channel: ChannelManagerConfig['channels'][number],
  config: ChannelManagerConfig,
): { status: ChannelConnectionStatus; message: string; simulated: boolean } {
  return channelStatus(channel, config);
}
