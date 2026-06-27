import { LIVE_GATEWAY_ENV_KEYS, probeLiveGateway } from '@/lib/integrations/live-probe';
import type { ChannelLinkConfig } from '@/lib/integrations/channel-manager/types';
import type { ChannelAdapter, ChannelAdapterContext, ChannelAdapterResult } from '@/lib/integrations/channel-manager/adapters/types';
import type { ChannelPulledReservation } from '@/lib/integrations/channel-manager/types';

type GatewaySyncResponse = {
  ok?: boolean;
  message?: string;
  pushedRates?: number;
  pushedAvailability?: number;
  reservations?: ChannelPulledReservation[];
  channels?: Array<{ channelId: string; status: string; message: string }>;
};

function gatewayUrl(): string | undefined {
  return process.env[LIVE_GATEWAY_ENV_KEYS.channel]?.trim()
    || process.env.ROOMIO_CHANNEL_GATEWAY_URL?.trim();
}

async function callGateway(
  action: 'test' | 'sync',
  channel: ChannelLinkConfig,
  ctx: ChannelAdapterContext,
): Promise<GatewaySyncResponse> {
  const base = gatewayUrl();
  if (!base) throw new Error('ROOMIO_CHANNEL_GATEWAY_URL tanımlı değil');

  const res = await fetch(`${base.replace(/\/$/, '')}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(channel.apiKey ? { Authorization: `Bearer ${channel.apiKey}` } : {}),
    },
    body: JSON.stringify({
      propertyId: ctx.propertyId,
      channelId: channel.channelId,
      hotelId: channel.propertyId,
      testOnly: ctx.testOnly,
      pushRates: channel.pushRates,
      pushAvailability: channel.pushAvailability,
      pullReservations: channel.pullReservations,
      rates: channel.pushRates ? ctx.rates : [],
      availability: channel.pushAvailability ? ctx.availability : [],
      mappings: ctx.config.virtualRoomMappings,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    return { ok: false, message: `Gateway HTTP ${res.status}` };
  }
  return (await res.json()) as GatewaySyncResponse;
}

function mapRates(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): number {
  if (!channel.pushRates) return 0;
  const types = new Set(
    ctx.config.virtualRoomMappings
      .filter((m) => m.pmsRoomTypeId)
      .map((m) => m.pmsRoomTypeId),
  );
  return ctx.rates.filter((r) => types.size === 0 || types.has(r.roomType)).length;
}

function mapAvail(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): number {
  if (!channel.pushAvailability) return 0;
  const types = new Set(ctx.config.virtualRoomMappings.map((m) => m.pmsRoomTypeId));
  return ctx.availability.filter((a) => types.size === 0 || types.has(a.roomType)).length;
}

async function runChannel(
  channel: ChannelLinkConfig,
  ctx: ChannelAdapterContext,
  action: 'test' | 'sync',
): Promise<ChannelAdapterResult> {
  const url = gatewayUrl();
  if (!url) {
    return {
      channelId: channel.channelId,
      ok: false,
      status: 'error',
      message: 'Canlı gateway URL eksik',
      simulated: false,
      pushedRates: 0,
      pushedAvailability: 0,
      pulledReservations: [],
    };
  }

  if (action === 'test') {
    const probe = await probeLiveGateway('ROOMIO_CHANNEL_GATEWAY_URL', 'Kanal gateway');
    return {
      channelId: channel.channelId,
      ok: probe.ok,
      status: probe.ok ? 'connected' : 'error',
      message: probe.message,
      simulated: probe.simulated,
      pushedRates: 0,
      pushedAvailability: 0,
      pulledReservations: [],
    };
  }

  const body = await callGateway('sync', channel, ctx);
  return {
    channelId: channel.channelId,
    ok: body.ok !== false,
    status: body.ok !== false ? 'connected' : 'error',
    message: body.message ?? (body.ok !== false ? 'Gateway senkronu tamam' : 'Gateway hatası'),
    simulated: false,
    pushedRates: body.pushedRates ?? mapRates(channel, ctx),
    pushedAvailability: body.pushedAvailability ?? mapAvail(channel, ctx),
    pulledReservations: body.reservations ?? [],
  };
}

export const gatewayChannelAdapter: ChannelAdapter = {
  channelIds: ['*'],
  testConnection: (channel, ctx) => runChannel(channel, ctx, 'test'),
  syncChannel: (channel, ctx) => runChannel(channel, ctx, 'sync'),
};

export function hasChannelGateway(): boolean {
  return Boolean(gatewayUrl());
}
