import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import type { ChannelSyncLogEntry } from '@/lib/integrations/channel-manager/types';

const FILE = 'channel-sync-log.json';
const MAX_ENTRIES = 50;

export async function appendChannelSyncLog(
  entry: Omit<ChannelSyncLogEntry, 'id' | 'at'>,
): Promise<ChannelSyncLogEntry> {
  const logs = await loadJsonConfig<ChannelSyncLogEntry[]>(FILE, []);
  const full: ChannelSyncLogEntry = {
    ...entry,
    id: `cml-${Date.now()}`,
    at: new Date().toISOString(),
  };
  const next = [full, ...logs].slice(0, MAX_ENTRIES);
  await saveJsonConfig(FILE, next);
  return full;
}

export async function listChannelSyncLogs(limit = 20): Promise<ChannelSyncLogEntry[]> {
  const logs = await loadJsonConfig<ChannelSyncLogEntry[]>(FILE, []);
  return logs.slice(0, limit);
}
