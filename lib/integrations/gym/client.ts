import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { saveFacilityBookingServer } from '@/lib/server/facility-bookings';
import { DEFAULT_GYM_CONFIG, type GymConfig } from '@/lib/integrations/gym/types';

const FILE = 'gym-config.json';

export async function loadGymConfig(): Promise<GymConfig> {
  return loadJsonConfig(FILE, DEFAULT_GYM_CONFIG);
}

export async function saveGymConfig(config: GymConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicGymCatalog() {
  const config = await loadGymConfig();
  return {
    ok: config.enabled,
    gymName: config.gymName,
    openFrom: config.openFrom,
    openTo: config.openTo,
    allowOnlineBooking: config.allowOnlineBooking,
    classes: config.classes.filter((c) => c.available),
  };
}

export async function bookGymClass(input: {
  classId: string;
  guest: string;
  roomNo: string;
  date: string;
}) {
  const config = await loadGymConfig();
  if (!config.enabled) return { ok: false, message: 'Spor salonu kapalı' };
  if (!config.allowOnlineBooking) return { ok: false, message: 'Online rezervasyon kapalı' };

  const gymClass = config.classes.find((c) => c.id === input.classId && c.available);
  if (!gymClass) return { ok: false, message: 'Ders bulunamadı' };

  const booking = await saveFacilityBookingServer('gym', {
    date: input.date,
    time: gymClass.schedule,
    guest: input.guest,
    roomNo: input.roomNo,
    party: 1,
    status: 'Bekliyor',
    notes: `${gymClass.name} — ${gymClass.instructor} (${gymClass.durationMinutes} dk)`,
  });

  return { ok: true, message: 'Spor dersi rezervasyonu alındı', booking, gymClass };
}
