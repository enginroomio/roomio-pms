import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { saveFacilityBookingServer } from '@/lib/server/facility-bookings';
import { DEFAULT_SPA_CONFIG, type SpaConfig } from '@/lib/spa/types';

const FILE = 'spa-config.json';

export async function loadSpaConfig(): Promise<SpaConfig> {
  return loadJsonConfig(FILE, DEFAULT_SPA_CONFIG);
}

export async function saveSpaConfig(config: SpaConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicSpaCatalog() {
  const config = await loadSpaConfig();
  return {
    ok: config.enabled,
    hotelName: config.hotelName,
    openFrom: config.openFrom,
    openTo: config.openTo,
    allowOnlineBooking: config.allowOnlineBooking,
    treatments: config.treatments.filter((t) => t.available),
  };
}

export async function bookSpaTreatment(input: {
  treatmentId: string;
  guest: string;
  roomNo: string;
  date: string;
  time: string;
  party?: number;
}) {
  const config = await loadSpaConfig();
  if (!config.enabled) return { ok: false, message: 'SPA kapalı' };
  if (!config.allowOnlineBooking) return { ok: false, message: 'Online SPA rezervasyonu kapalı' };

  const treatment = config.treatments.find((t) => t.id === input.treatmentId && t.available);
  if (!treatment) return { ok: false, message: 'Tedavi bulunamadı' };

  const booking = await saveFacilityBookingServer('spa', {
    date: input.date,
    time: input.time,
    guest: input.guest,
    roomNo: input.roomNo,
    party: input.party ?? 1,
    status: 'Bekliyor',
    notes: `${treatment.name} (${treatment.durationMinutes} dk · ${treatment.price} ${treatment.currency})`,
  });

  return { ok: true, message: 'SPA rezervasyonu alındı', booking, treatment };
}
