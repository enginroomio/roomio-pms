import { availabilityMatrix } from '@/lib/server/report-export';
import { getAllReservationsServer, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getRateCalendarServer } from '@/lib/server/rate-calendar';
import type { ChannelManagerConfig } from '@/lib/integrations/channel-manager/types';
import { applyChannelMarkup, channelStrategiesMap } from '@/lib/revenue-management/channel-strategy';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type ChannelRatePush = {
  date: string;
  roomType: string;
  channelRoomTypeId: string;
  rate: number;
  currency: string;
  ratePlanCode: string;
};

export type ChannelAvailabilityPush = {
  date: string;
  roomType: string;
  channelRoomTypeId: string;
  available: number;
  stopSale?: boolean;
};

export async function buildChannelPushPayload(
  config: ChannelManagerConfig,
  propertyId = DEFAULT_PROPERTY_ID,
  horizonDays = 14,
  channelId?: string,
): Promise<{ rates: ChannelRatePush[]; availability: ChannelAvailabilityPush[] }> {
  await init();
  const today = new Date().toISOString().slice(0, 10);
  const to = addDays(today, horizonDays - 1);
  const reservations = await getAllReservationsServer(propertyId);
  const matrix = availabilityMatrix(reservations, today, horizonDays);
  const rates = await getRateCalendarServer(today, to, { propertyId });

  const mappingByPms = new Map(
    config.virtualRoomMappings.map((m) => [m.pmsRoomTypeId, m.channelRoomTypeId]),
  );
  const strategies = channelId ? await channelStrategiesMap() : null;
  const strategy = channelId && strategies ? strategies.get(channelId) : undefined;

  const rateRows: ChannelRatePush[] = [];
  const availRows: ChannelAvailabilityPush[] = [];

  for (const day of matrix) {
    for (const cell of day.cells) {
      const channelRoomTypeId = mappingByPms.get(cell.type) ?? cell.type;
      const rateRow = rates.find((r) => r.date === day.date && (r.roomType === cell.type || !r.roomType));
      if (rateRow) {
        const baseRate = strategy ? applyChannelMarkup(rateRow.rate, strategy) : rateRow.rate;
        rateRows.push({
          date: day.date,
          roomType: cell.type,
          channelRoomTypeId,
          rate: baseRate,
          currency: rateRow.currency,
          ratePlanCode: rateRow.ratePlanCode,
        });
      }
      availRows.push({
        date: day.date,
        roomType: cell.type,
        channelRoomTypeId,
        available: cell.available,
        stopSale: cell.available <= 0,
      });
    }
  }

  return { rates: rateRows, availability: availRows };
}
