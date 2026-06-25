import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import {
  DEFAULT_MARINA_CONFIG,
  type MarinaBooking,
  type MarinaConfig,
} from '@/lib/integrations/marina/types';

const CONFIG_FILE = 'marina-config.json';
const BOOKINGS_FILE = 'marina-bookings.json';

export async function loadMarinaConfig(): Promise<MarinaConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_MARINA_CONFIG);
}

export async function saveMarinaConfig(config: MarinaConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

async function loadBookings(): Promise<MarinaBooking[]> {
  return loadJsonConfig(BOOKINGS_FILE, [] as MarinaBooking[]);
}

async function saveBookings(bookings: MarinaBooking[]): Promise<void> {
  await saveJsonConfig(BOOKINGS_FILE, bookings);
}

export async function testMarinaConnection(config = DEFAULT_MARINA_CONFIG): Promise<{
  ok: boolean;
  message: string;
  simulated?: boolean;
}> {
  if (!config.enabled) return { ok: false, message: 'Marina modülü kapalı' };
  const simulated = !isIntegrationLiveMode();
  if (!simulated && process.env.ROOMIO_MARINA_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_MARINA_GATEWAY_URL', 'Marina');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: 'Simülasyon — marina yönetimi hazır' };
}

export async function getPublicMarinaCatalog() {
  const config = await loadMarinaConfig();
  return {
    ok: config.enabled,
    marinaName: config.marinaName,
    allowOnlineBooking: config.allowOnlineBooking,
    checkInTime: config.checkInTime,
    checkOutTime: config.checkOutTime,
    berths: config.berths.filter((b) => b.available),
  };
}

export async function bookMarinaBerth(input: {
  berthId: string;
  vesselName: string;
  captain: string;
  lengthM: number;
  arrival: string;
  departure: string;
}) {
  const config = await loadMarinaConfig();
  if (!config.enabled) return { ok: false, message: 'Marina kapalı' };
  if (!config.allowOnlineBooking) return { ok: false, message: 'Online marina rezervasyonu kapalı' };

  const berth = config.berths.find((b) => b.id === input.berthId && b.available);
  if (!berth) return { ok: false, message: 'Rıhtım bulunamadı' };
  if (input.lengthM > berth.lengthM) {
    return { ok: false, message: `Tekne uzunluğu maksimum ${berth.lengthM}m olmalı` };
  }

  const booking: MarinaBooking = {
    id: `mar-${Date.now()}`,
    berthId: berth.id,
    berthName: berth.name,
    vesselName: input.vesselName,
    captain: input.captain,
    lengthM: input.lengthM,
    arrival: input.arrival,
    departure: input.departure,
    status: 'Bekliyor',
    createdAt: new Date().toISOString(),
  };

  const bookings = await loadBookings();
  bookings.push(booking);
  await saveBookings(bookings);

  return { ok: true, message: 'Marina rezervasyonu alındı', booking, berth };
}

export async function listMarinaBookings(): Promise<MarinaBooking[]> {
  return loadBookings();
}
