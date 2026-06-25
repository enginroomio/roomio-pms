import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_LITE_MOBILE_CONFIG, type LiteMobileConfig } from '@/lib/integrations/lite-mobile/types';

const FILE = 'lite-mobile-config.json';

export async function loadLiteMobileConfig(): Promise<LiteMobileConfig> {
  return loadJsonConfig(FILE, DEFAULT_LITE_MOBILE_CONFIG);
}

export async function saveLiteMobileConfig(config: LiteMobileConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicLiteMobileInfo() {
  const config = await loadLiteMobileConfig();
  return {
    ok: config.enabled,
    appName: config.appName,
    minAppVersion: config.minAppVersion,
    features: {
      housekeeping: config.allowHousekeeping,
      maintenance: config.allowMaintenance,
      guestRequests: config.allowGuestRequests,
      minibar: config.allowMinibar,
      offlineSync: config.offlineSync,
    },
  };
}
