import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  DEFAULT_VIOFUN_CONFIG,
  type ViofunBooking,
  type ViofunConfig,
} from '@/lib/integrations/viofun/types';

const CONFIG_FILE = 'viofun-config.json';
const BOOKINGS_FILE = 'viofun-bookings.json';

export async function loadViofunConfig(): Promise<ViofunConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_VIOFUN_CONFIG);
}

export async function saveViofunConfig(config: ViofunConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

async function loadBookings(): Promise<ViofunBooking[]> {
  return loadJsonConfig(BOOKINGS_FILE, [] as ViofunBooking[]);
}

async function saveBookings(bookings: ViofunBooking[]): Promise<void> {
  await saveJsonConfig(BOOKINGS_FILE, bookings);
}

export async function testViofunConnection(config = DEFAULT_VIOFUN_CONFIG): Promise<{
  ok: boolean;
  message: string;
  simulated?: boolean;
}> {
  if (!config.enabled) return { ok: false, message: 'Viofun kapalı' };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_VIOFUN_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_VIOFUN_GATEWAY_URL', 'Viofun');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — Viofun aktivite API hazır' };
}

export async function getPublicViofunCatalog() {
  const config = await loadViofunConfig();
  return {
    ok: config.enabled,
    hotelName: config.hotelName,
    allowGuestBooking: config.allowGuestBooking,
    activities: config.activities.filter((a) => a.available),
  };
}

export async function bookViofunActivity(input: {
  activityId: string;
  guest: string;
  roomNo: string;
  date: string;
  time: string;
  party?: number;
}) {
  const config = await loadViofunConfig();
  if (!config.enabled) return { ok: false, message: 'Viofun kapalı' };
  if (!config.allowGuestBooking) return { ok: false, message: 'Misafir rezervasyonu kapalı' };

  const activity = config.activities.find((a) => a.id === input.activityId && a.available);
  if (!activity) return { ok: false, message: 'Aktivite bulunamadı' };

  const booking: ViofunBooking = {
    id: `vf-${Date.now()}`,
    activityId: activity.id,
    activityName: activity.name,
    guest: input.guest,
    roomNo: input.roomNo,
    date: input.date,
    time: input.time,
    party: input.party ?? 1,
    status: 'Bekliyor',
    createdAt: new Date().toISOString(),
  };

  const bookings = await loadBookings();
  bookings.push(booking);
  await saveBookings(bookings);

  return { ok: true, message: 'Aktivite rezervasyonu alındı', booking, activity };
}

export async function listViofunBookings(): Promise<ViofunBooking[]> {
  return loadBookings();
}
