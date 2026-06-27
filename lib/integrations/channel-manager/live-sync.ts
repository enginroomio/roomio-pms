import { effectiveSimulateWhenOffline, isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { bookingAdapter, expediaAdapter, simulationAdapter } from '@/lib/integrations/channel-manager/adapters/ota';
import { gatewayChannelAdapter, hasChannelGateway } from '@/lib/integrations/channel-manager/adapters/gateway';
import type { ChannelAdapter, ChannelAdapterContext, ChannelAdapterResult } from '@/lib/integrations/channel-manager/adapters/types';
import { buildChannelPushPayload } from '@/lib/integrations/channel-manager/payload';
import { importChannelReservations } from '@/lib/integrations/channel-manager/import-reservations';
import { appendChannelSyncLog } from '@/lib/integrations/channel-manager/sync-log';
import type {
  ChannelConnectionStatus,
  ChannelLinkConfig,
  ChannelManagerConfig,
  ChannelPulledReservation,
  ChannelSyncResult,
} from '@/lib/integrations/channel-manager/types';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { saveJsonConfig } from '@/lib/integrations/_config-store';

const ADAPTERS: ChannelAdapter[] = [gatewayChannelAdapter, bookingAdapter, expediaAdapter, simulationAdapter];

function pickAdapter(channel: ChannelLinkConfig, useGateway: boolean): ChannelAdapter {
  if (useGateway) return gatewayChannelAdapter;
  const specific = ADAPTERS.find((a) => a.channelIds.includes(channel.channelId));
  return specific ?? simulationAdapter;
}

function channelStatus(
  channel: ChannelLinkConfig,
  config: ChannelManagerConfig,
): { status: ChannelConnectionStatus; message: string; simulated: boolean } {
  if (!channel.enabled) {
    return { status: 'disconnected', message: 'Kanal kapalı', simulated: false };
  }
  if (!channel.propertyId.trim()) {
    return { status: 'pending', message: 'Otel / property ID girilmedi', simulated: false };
  }
  const live = isIntegrationLiveMode() && !effectiveSimulateWhenOffline(config.simulateWhenOffline);
  if (live && !hasChannelGateway() && !channel.apiKey.trim()) {
    return { status: 'pending', message: 'API anahtarı eksik (canlı mod)', simulated: false };
  }
  if (!live || effectiveSimulateWhenOffline(config.simulateWhenOffline)) {
    return { status: 'connected', message: 'Simülasyon — iki yönlü senkron hazır', simulated: true };
  }
  if (hasChannelGateway()) {
    return { status: 'connected', message: 'Canlı gateway bağlantısı', simulated: false };
  }
  return { status: 'connected', message: 'OTA kimlik bilgileri kayıtlı', simulated: false };
}

async function runAdapter(
  channel: ChannelLinkConfig,
  ctx: ChannelAdapterContext,
  testOnly: boolean,
): Promise<ChannelAdapterResult> {
  const useGateway = isIntegrationLiveMode()
    && !effectiveSimulateWhenOffline(ctx.config.simulateWhenOffline)
    && hasChannelGateway();
  const adapter = pickAdapter(channel, useGateway);
  const channelPayload = await buildChannelPushPayload(ctx.config, ctx.propertyId, 14, channel.channelId);
  const channelCtx: ChannelAdapterContext = {
    ...ctx,
    rates: channelPayload.rates,
    availability: channelPayload.availability,
  };
  return testOnly ? adapter.testConnection(channel, channelCtx) : adapter.syncChannel(channel, channelCtx);
}

export async function testChannelManagerLive(
  config: ChannelManagerConfig,
  propertyId = DEFAULT_PROPERTY_ID,
): Promise<ChannelSyncResult> {
  return runChannelSync(config, propertyId, { testOnly: true });
}

export async function runChannelSync(
  config: ChannelManagerConfig,
  propertyId = DEFAULT_PROPERTY_ID,
  opts: { testOnly?: boolean } = {},
): Promise<ChannelSyncResult> {
  const testOnly = opts.testOnly ?? false;
  const enabled = config.channels.filter((c) => c.enabled);

  if (!config.enabled) {
    return {
      ok: false,
      message: 'Kanal yöneticisi devre dışı',
      pushedRates: 0,
      pushedAvailability: 0,
      pulledReservations: 0,
      channels: [],
    };
  }
  if (!enabled.length) {
    return {
      ok: false,
      message: 'En az bir kanal etkinleştirin',
      pushedRates: 0,
      pushedAvailability: 0,
      pulledReservations: 0,
      channels: [],
    };
  }

  const liveMode = isIntegrationLiveMode() && !effectiveSimulateWhenOffline(config.simulateWhenOffline);
  const { rates, availability } = await buildChannelPushPayload(config, propertyId);
  const ctx: ChannelAdapterContext = {
    propertyId,
    config,
    rates,
    availability,
    testOnly,
  };

  const results: ChannelAdapterResult[] = [];
  for (const channel of enabled) {
    const pre = channelStatus(channel, config);
    if (pre.status === 'disconnected') continue;
    results.push(await runAdapter(channel, ctx, testOnly));
  }

  const simulated = results.every((r) => r.simulated) || !liveMode;
  const pulled: ChannelPulledReservation[] = results.flatMap((r) => r.pulledReservations);
  let imported = 0;

  if (!testOnly && pulled.length > 0) {
    imported = await importChannelReservations(pulled, config, propertyId);
  }

  const pushedRates = results.reduce((s, r) => s + r.pushedRates, 0);
  const pushedAvailability = results.reduce((s, r) => s + r.pushedAvailability, 0);
  const ok = results.every((r) => r.ok);

  const now = new Date().toISOString();
  const updatedChannels = config.channels.map((c) => {
    const result = results.find((r) => r.channelId === c.channelId);
    if (!result) return c;
    return {
      ...c,
      lastSyncAt: now,
      lastSyncStatus: result.status,
      lastSyncMessage: result.message,
    };
  });
  await saveJsonConfig('channel-manager-config.json', { ...config, channels: updatedChannels });

  const channelSummary = results.map((r) => ({
    channelId: r.channelId,
    status: r.status,
    message: r.message,
  }));

  const message = simulated
    ? `Simülasyon: ${enabled.length} kanal — ${pushedRates} fiyat, ${pushedAvailability} müsaitlik, ${pulled.length} rezervasyon`
    : `Canlı senkron: ${pushedRates} fiyat, ${pushedAvailability} müsaitlik, ${imported} rezervasyon içe aktarıldı`;

  const log = await appendChannelSyncLog({
    ok,
    simulated,
    liveMode,
    testOnly,
    pushedRates,
    pushedAvailability,
    pulledReservations: pulled.length,
    importedReservations: imported,
    message,
    channels: channelSummary,
  });

  return {
    ok,
    simulated,
    liveMode,
    message,
    pushedRates,
    pushedAvailability,
    pulledReservations: pulled.length,
    importedReservations: imported,
    channels: channelSummary,
    logId: log.id,
  };
}

export { channelStatus };
