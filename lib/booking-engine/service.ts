import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway, LIVE_GATEWAY_ENV_KEYS } from '@/lib/integrations/live-probe';
import { loadBookingEngineConfig } from '@/lib/booking-engine/client';
import type {
  BookingAvailabilityDay,
  OnlineBookingRequest,
  OnlineBookingResult,
} from '@/lib/booking-engine/types';
import { applyTierDiscount, ensureLoyaltyAccount } from '@/lib/loyalty/service';
import { loadLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import { signGuestPortalToken } from '@/lib/guest-portal/tokens';
import { getAllReservationsServer, addReservationServer } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { availabilityMatrix } from '@/lib/server/report-export';
import { getRateCalendarServer } from '@/lib/server/rate-calendar';
import type { Reservation } from '@/lib/types/reservation';

const ROOM_TYPES = ['SGL', 'DBL', 'TWN', 'TRP', 'SUI'] as const;

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

export async function getBookingAvailability(
  checkIn: string,
  checkOut: string,
  propertyId = DEFAULT_PROPERTY_ID,
): Promise<{ ok: boolean; days: BookingAvailabilityDay[]; message?: string }> {
  const config = await loadBookingEngineConfig();
  if (!config.enabled) {
    return { ok: false, days: [], message: 'Online rezervasyon kapalı' };
  }

  const nights = nightsBetween(checkIn, checkOut);
  const reservations = await getAllReservationsServer(propertyId);
  const matrix = availabilityMatrix(reservations, checkIn, nights);
  const rates = await getRateCalendarServer(checkIn, checkOut, {
    code: config.defaultRatePlan,
    propertyId,
  });

  const days: BookingAvailabilityDay[] = [];
  for (const day of matrix) {
    for (const cell of day.cells) {
      if (!ROOM_TYPES.includes(cell.type as (typeof ROOM_TYPES)[number])) continue;
      const rateRow = rates.find((r) => r.date === day.date && (r.roomType === cell.type || !r.roomType));
      days.push({
        date: day.date,
        roomType: cell.type,
        available: cell.available,
        rate: rateRow?.rate ?? 0,
        currency: rateRow?.currency ?? config.currency,
        mealPlan: config.defaultMealPlan,
      });
    }
  }

  return { ok: true, days };
}

export async function createOnlineBooking(
  req: OnlineBookingRequest,
  propertyId = DEFAULT_PROPERTY_ID,
): Promise<OnlineBookingResult> {
  const config = await loadBookingEngineConfig();
  if (!config.enabled) {
    return { ok: false, message: 'Online rezervasyon kapalı' };
  }

  if (!req.guestName?.trim() || !req.email?.trim() || !req.checkIn || !req.checkOut || !req.roomType) {
    return { ok: false, message: 'Zorunlu alanlar eksik' };
  }

  const avail = await getBookingAvailability(req.checkIn, req.checkOut, propertyId);
  if (!avail.ok) return { ok: false, message: avail.message ?? 'Müsaitlik alınamadı' };

  const minAvail = avail.days
    .filter((d) => d.roomType === req.roomType)
    .reduce((m, d) => Math.min(m, d.available), Infinity);
  if (!Number.isFinite(minAvail) || minAvail < 1) {
    return { ok: false, message: 'Seçilen oda tipi için müsaitlik yok' };
  }

  const nightly = avail.days.filter((d) => d.roomType === req.roomType);
  let totalAmount = nightly.reduce((s, d) => s + d.rate, 0);
  const nights = nightsBetween(req.checkIn, req.checkOut);
  const avgRate = nightly.length ? Math.round(totalAmount / nightly.length) : 0;

  let loyaltyDiscount: { percent: number; tierName: string; savedTry: number } | undefined;
  if (config.loyaltyEnabled) {
    const loyaltyConfig = await loadLoyaltyConfig();
    if (loyaltyConfig.enabled && loyaltyConfig.autoApplyOnBooking) {
      const account = await ensureLoyaltyAccount({
        guestName: req.guestName.trim(),
        email: req.email.trim(),
        phone: req.phone?.trim(),
        propertyId,
      });
      const { discounted, discountPercent, tierName } = applyTierDiscount(
        loyaltyConfig,
        account,
        totalAmount,
      );
      if (discountPercent > 0) {
        loyaltyDiscount = {
          percent: discountPercent,
          tierName,
          savedTry: totalAmount - discounted,
        };
        totalAmount = discounted;
      }
    }
  }

  if (config.requirePrepayment && req.paymentMethod !== 'card') {
    return { ok: false, message: 'Bu otel için online ön ödeme zorunludur' };
  }

  const id = `web-${Date.now()}`;
  const refNo = `WEB-${Date.now().toString(36).toUpperCase()}`;
  const reservation: Reservation = {
    id,
    refNo,
    guestName: req.guestName.trim(),
    email: req.email.trim(),
    phone: req.phone?.trim(),
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    roomType: req.roomType,
    adults: req.adults || 2,
    children: req.children ?? 0,
    mealPlan: req.mealPlan ?? config.defaultMealPlan,
    rate: avgRate,
    currency: config.currency,
    agency: 'DIRECT-WEB',
    market: 'WEB',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString().slice(0, 10),
    notes: `Online rezervasyon${req.paymentMethod === 'card' ? ` · Sanal POS (${req.cardLast4 ?? '****'})` : ' · Otelde ödeme'}${loyaltyDiscount ? ` · Sadakat ${loyaltyDiscount.tierName} %${loyaltyDiscount.percent} (−${loyaltyDiscount.savedTry}₺)` : ''}`,
    extraData: {
      source: 'booking-engine',
      nights: String(nights),
      totalAmount: String(totalAmount),
      ...(loyaltyDiscount
        ? {
            loyaltyTier: loyaltyDiscount.tierName,
            loyaltyDiscountPercent: String(loyaltyDiscount.percent),
            loyaltySavedTry: String(loyaltyDiscount.savedTry),
          }
        : {}),
    },
  };

  await addReservationServer(reservation, propertyId);
  const guestPortalToken = await signGuestPortalToken({
    reservationId: id,
    refNo,
    email: req.email.trim(),
    propertyId,
  });

  let simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (isIntegrationLiveMode() && process.env.ROOMIO_BOOKING_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.booking, 'Online rezervasyon');
    simulated = probe.simulated;
    if (!probe.ok && !probe.simulated) {
      return { ok: false, message: probe.message };
    }
  }

  return {
    ok: true,
    reservationId: id,
    refNo,
    guestPortalToken,
    totalAmount,
    currency: config.currency,
    simulated,
    message: simulated
      ? `Rezervasyon onaylandı (${refNo}) — simülasyon modu`
      : `Rezervasyon onaylandı (${refNo})`,
  };
}
