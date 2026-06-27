import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { lookupGuestSession, performGuestCheckIn } from '@/lib/guest-portal/session';
import { DEFAULT_KIOSK_CONFIG, type KioskConfig } from '@/lib/kiosk/types';

const FILE = 'kiosk-config.json';

export async function loadKioskConfig(): Promise<KioskConfig> {
  return loadJsonConfig(FILE, DEFAULT_KIOSK_CONFIG);
}

export async function saveKioskConfig(config: KioskConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function kioskLookup(input: { refNo?: string; email?: string; token?: string }) {
  const config = await loadKioskConfig();
  if (!config.enabled) return { ok: false, message: 'Kiosk kapalı' };
  return lookupGuestSession(input);
}

export async function kioskCheckIn(token: string) {
  const config = await loadKioskConfig();
  if (!config.enabled) return { ok: false, message: 'Kiosk kapalı' };
  const result = await performGuestCheckIn(token, 'Check-in kiosk');
  return {
    ...result,
    printRoomKey: config.printRoomKey,
  };
}
