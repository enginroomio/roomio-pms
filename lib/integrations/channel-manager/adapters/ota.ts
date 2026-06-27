import type { ChannelLinkConfig } from '@/lib/integrations/channel-manager/types';
import type { ChannelAdapter, ChannelAdapterContext, ChannelAdapterResult } from '@/lib/integrations/channel-manager/adapters/types';
import type { ChannelPulledReservation } from '@/lib/integrations/channel-manager/types';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function validateCredentials(channel: ChannelLinkConfig): string | null {
  if (!channel.propertyId.trim()) return 'Property / Hotel ID girilmedi';
  if (!channel.apiKey.trim()) return 'API anahtarı eksik';
  if (channel.channelId === 'booking' && !/^\d{5,}$/.test(channel.propertyId.trim())) {
    return 'Booking.com Hotel ID sayısal olmalı';
  }
  return null;
}

function simulatedPull(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): ChannelPulledReservation[] {
  if (!channel.pullReservations || ctx.testOnly) return [];
  const today = new Date().toISOString().slice(0, 10);
  return [{
    channelId: channel.channelId,
    externalRef: `SIM-${Date.now().toString(36)}`,
    guestName: `${channel.channelId.toUpperCase()} Misafir (Sim)`,
    email: `sim+${channel.channelId}@roomio.test`,
    checkIn: addDays(today, 3),
    checkOut: addDays(today, 5),
    roomType: 'DBL',
    adults: 2,
    rate: 4200,
    currency: 'TRY',
    mealPlan: 'BB',
    status: 'new',
  }];
}

function countPush(channel: ChannelLinkConfig, ctx: ChannelAdapterContext): { rates: number; avail: number } {
  const types = new Set(ctx.config.virtualRoomMappings.map((m) => m.pmsRoomTypeId));
  const rates = channel.pushRates
    ? ctx.rates.filter((r) => types.size === 0 || types.has(r.roomType)).length
    : 0;
  const avail = channel.pushAvailability
    ? ctx.availability.filter((a) => types.size === 0 || types.has(a.roomType)).length
    : 0;
  return { rates, avail };
}

function makeOtaAdapter(channelIds: string[], label: string): ChannelAdapter {
  return {
    channelIds,
    async testConnection(channel, ctx): Promise<ChannelAdapterResult> {
      const err = validateCredentials(channel);
      const { rates, avail } = countPush(channel, ctx);
      if (err) {
        return {
          channelId: channel.channelId,
          ok: false,
          status: 'pending',
          message: err,
          simulated: true,
          pushedRates: 0,
          pushedAvailability: 0,
          pulledReservations: [],
        };
      }
      return {
        channelId: channel.channelId,
        ok: true,
        status: 'connected',
        message: `${label} kimlik bilgileri doğrulandı (canlı uç bekleniyor)`,
        simulated: true,
        pushedRates: rates,
        pushedAvailability: avail,
        pulledReservations: [],
      };
    },
    async syncChannel(channel, ctx): Promise<ChannelAdapterResult> {
      const err = validateCredentials(channel);
      const { rates, avail } = countPush(channel, ctx);
      if (err) {
        return {
          channelId: channel.channelId,
          ok: false,
          status: 'error',
          message: err,
          simulated: true,
          pushedRates: 0,
          pushedAvailability: 0,
          pulledReservations: [],
        };
      }
      const pulled = simulatedPull(channel, ctx);
      return {
        channelId: channel.channelId,
        ok: true,
        status: 'connected',
        message: `${label} simülasyon senkronu — ${rates} fiyat, ${avail} müsaitlik${pulled.length ? `, ${pulled.length} rezervasyon` : ''}`,
        simulated: true,
        pushedRates: rates,
        pushedAvailability: avail,
        pulledReservations: pulled,
      };
    },
  };
}

export const bookingAdapter = makeOtaAdapter(['booking'], 'Booking.com');
export const expediaAdapter = makeOtaAdapter(['expedia', 'hotels-com'], 'Expedia');

export const simulationAdapter: ChannelAdapter = {
  channelIds: ['*'],
  async testConnection(channel, ctx) {
    const { rates, avail } = countPush(channel, ctx);
    return {
      channelId: channel.channelId,
      ok: true,
      status: 'connected',
      message: 'Simülasyon — bağlantı hazır',
      simulated: true,
      pushedRates: rates,
      pushedAvailability: avail,
      pulledReservations: [],
    };
  },
  async syncChannel(channel, ctx) {
    const { rates, avail } = countPush(channel, ctx);
    const pulled = simulatedPull(channel, ctx);
    return {
      channelId: channel.channelId,
      ok: true,
      status: 'connected',
      message: 'Simülasyon senkronu tamamlandı',
      simulated: true,
      pushedRates: rates,
      pushedAvailability: avail,
      pulledReservations: pulled,
    };
  },
};
