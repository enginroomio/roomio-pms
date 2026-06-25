import { loadDynamicPricingConfig } from '@/lib/dynamic-pricing/client';
import { CHANNEL_CATALOG } from '@/lib/integrations/channel-manager/types';
import { loadRevenueManagementConfig } from '@/lib/revenue-management/config';
import type {
  CompetitorBenchmark,
  RevenueChannelMix,
  RevenueForecastDay,
  RevenueForecastSnapshot,
} from '@/lib/revenue-management/types';
import { getAllReservationsServer, getBusinessDate, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { availabilityMatrix } from '@/lib/server/report-export';
import { getRateCalendarServer } from '@/lib/server/rate-calendar';
import type { Reservation } from '@/lib/types/reservation';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsOverlap(res: Reservation, date: string): boolean {
  return res.status !== 'CANCELLED' && res.checkIn <= date && res.checkOut > date;
}

function channelLabel(agency: string): { channel: string; channelId: string } {
  const lower = agency.toLowerCase();
  const hit = CHANNEL_CATALOG.find(
    (c) => lower.includes(c.name.toLowerCase()) || lower.includes(c.id),
  );
  if (hit) return { channel: hit.name, channelId: hit.id };
  if (lower.includes('booking')) return { channel: 'Booking.com', channelId: 'booking' };
  if (lower.includes('expedia')) return { channel: 'Expedia', channelId: 'expedia' };
  if (lower.includes('web') || lower.includes('direkt')) return { channel: 'Direkt Satış', channelId: 'roomio-direct' };
  return { channel: agency || 'Diğer', channelId: 'other' };
}

function competitorAdjustment(benchmark: CompetitorBenchmark): number {
  if (!benchmark.enabled) return 0;
  const delta = benchmark.marketIndex - 50;
  return Math.round((delta / 10) * benchmark.adjustmentPer10Points);
}

function buildRecommendations(
  days: RevenueForecastDay[],
  competitor: CompetitorBenchmark,
  avgOccupancy: number,
): string[] {
  const actions: string[] = [];
  const compAdj = competitorAdjustment(competitor);

  if (avgOccupancy < 45) {
    actions.push('Düşük doluluk — lead-time indirimi veya OTA promosyonu düşünün.');
  } else if (avgOccupancy > 85) {
    actions.push('Yüksek doluluk — BAR fiyatını %5–10 artırın, stop-sale gözden geçirin.');
  }

  if (competitor.enabled && compAdj < -3) {
    actions.push(`Rakip baskısı yüksek (endeks ${competitor.marketIndex}) — direkt kanal indirimi önerilir.`);
  }

  const weakDays = days.filter((d) => d.occupancyPct < 50 && d.date >= new Date().toISOString().slice(0, 10));
  if (weakDays.length >= 3) {
    actions.push(`${weakDays.length} günde doluluk <%50 — kanal fiyat farklarını gözden geçirin.`);
  }

  if (!actions.length) {
    actions.push('Mevcut fiyat stratejisi dengeli — günlük pickup takibi yeterli.');
  }

  return actions;
}

export async function getRevenueForecast(
  propertyId = DEFAULT_PROPERTY_ID,
  horizonDays = 14,
): Promise<RevenueForecastSnapshot> {
  await init();
  const businessDate = await getBusinessDate(propertyId);
  const to = addDays(businessDate, horizonDays - 1);
  const reservations = await getAllReservationsServer(propertyId);
  const matrix = availabilityMatrix(reservations, businessDate, horizonDays);
  const pricing = await loadDynamicPricingConfig();
  const rates = await getRateCalendarServer(businessDate, to, {
    code: pricing.defaultRatePlan,
    propertyId,
  });
  const rms = await loadRevenueManagementConfig();
  const currency = rates[0]?.currency ?? 'TRY';

  const days: RevenueForecastDay[] = matrix.map((day) => {
    const booked = reservations.filter((r) => nightsOverlap(r, day.date));
    const bookedRevenue = booked.reduce((s, r) => s + r.rate, 0);
    const roomsSold = day.totalBooked;
    const totalRooms = day.totalRooms;
    const roomsAvailable = day.totalAvail;

    const barRates = day.cells
      .map((cell) => rates.find((r) => r.date === day.date && (r.roomType === cell.type || !r.roomType))?.rate ?? 0)
      .filter((r) => r > 0);
    const avgBar = barRates.length
      ? Math.round(barRates.reduce((a, b) => a + b, 0) / barRates.length)
      : 0;

    const unsoldRevenue = roomsAvailable * avgBar;
    const forecastRevenue = bookedRevenue + unsoldRevenue;
    const adr = roomsSold > 0 ? Math.round(bookedRevenue / roomsSold) : avgBar;
    const revpar = totalRooms > 0 ? Math.round(forecastRevenue / totalRooms) : 0;

    return {
      date: day.date,
      occupancyPct: day.occupancyPct,
      roomsSold,
      roomsAvailable,
      totalRooms,
      bookedRevenue,
      forecastRevenue,
      adr,
      revpar,
      suggestedRate: avgBar,
      currency,
    };
  });

  const avgOccupancy = days.length
    ? Math.round(days.reduce((s, d) => s + d.occupancyPct, 0) / days.length)
    : 0;
  const totalForecastRevenue = days.reduce((s, d) => s + d.forecastRevenue, 0);
  const totalRoomsSold = days.reduce((s, d) => s + d.roomsSold, 0);
  const totalRoomNights = days.reduce((s, d) => s + d.totalRooms, 0);
  const avgAdr = totalRoomsSold > 0
    ? Math.round(days.reduce((s, d) => s + d.bookedRevenue, 0) / totalRoomsSold)
    : 0;
  const avgRevpar = totalRoomNights > 0 ? Math.round(totalForecastRevenue / totalRoomNights) : 0;
  const unsoldRoomNights = days.reduce((s, d) => s + d.roomsAvailable, 0);

  const channelAgg = new Map<string, RevenueChannelMix>();
  for (const res of reservations) {
    if (res.status === 'CANCELLED') continue;
    const { channel, channelId } = channelLabel(res.agency);
    const nights = Math.max(1, Math.round(
      (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / 86_400_000,
    ));
    const revenue = res.rate * nights;
    const existing = channelAgg.get(channelId);
    if (!existing) {
      channelAgg.set(channelId, { channel, channelId, rooms: nights, revenue, sharePct: 0 });
    } else {
      existing.rooms += nights;
      existing.revenue += revenue;
    }
  }
  const totalChannelRevenue = [...channelAgg.values()].reduce((s, c) => s + c.revenue, 0);
  const channelMix = [...channelAgg.values()]
    .map((c) => ({
      ...c,
      sharePct: totalChannelRevenue > 0 ? Math.round((c.revenue / totalChannelRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    ok: true,
    businessDate,
    horizonDays,
    currency,
    days,
    summary: {
      avgOccupancy,
      totalForecastRevenue,
      avgAdr,
      avgRevpar,
      unsoldRoomNights,
    },
    channelMix,
    competitor: rms.competitor,
    recommendedActions: buildRecommendations(days, rms.competitor, avgOccupancy),
  };
}

export { competitorAdjustment };
