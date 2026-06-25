import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { saveFacilityBookingServer } from '@/lib/server/facility-bookings';
import {
  DEFAULT_RESTAURANT_BOOKING_CONFIG,
  type RestaurantBookingConfig,
} from '@/lib/integrations/restaurant-booking/types';

const FILE = 'restaurant-booking-config.json';

export async function loadRestaurantBookingConfig(): Promise<RestaurantBookingConfig> {
  return loadJsonConfig(FILE, DEFAULT_RESTAURANT_BOOKING_CONFIG);
}

export async function saveRestaurantBookingConfig(config: RestaurantBookingConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicRestaurantCatalog() {
  const config = await loadRestaurantBookingConfig();
  return {
    ok: config.enabled,
    restaurantName: config.restaurantName,
    openFrom: config.openFrom,
    openTo: config.openTo,
    allowOnlineBooking: config.allowOnlineBooking,
    maxPartySize: config.maxPartySize,
    tables: config.tables.filter((t) => t.available),
  };
}

export async function bookRestaurantTable(input: {
  guest: string;
  roomNo?: string;
  date: string;
  time: string;
  party: number;
  tableId?: string;
  notes?: string;
}) {
  const config = await loadRestaurantBookingConfig();
  if (!config.enabled) return { ok: false, message: 'Restoran rezervasyonu kapalı' };
  if (!config.allowOnlineBooking) return { ok: false, message: 'Online rezervasyon kapalı' };
  if (input.party > config.maxPartySize) {
    return { ok: false, message: `Maksimum ${config.maxPartySize} kişi` };
  }

  const table = input.tableId
    ? config.tables.find((t) => t.id === input.tableId && t.available && t.seats >= input.party)
    : config.tables.find((t) => t.available && t.seats >= input.party);

  const booking = await saveFacilityBookingServer('restaurant', {
    date: input.date,
    time: input.time,
    guest: input.guest,
    roomNo: input.roomNo ?? '—',
    party: input.party,
    status: 'Bekliyor',
    notes: [table ? `Masa: ${table.name}` : undefined, input.notes].filter(Boolean).join(' · '),
  });

  return { ok: true, message: 'Restoran rezervasyonu alındı', booking, table };
}
