import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_GUEST_APP_CONFIG, type GuestAppConfig } from '@/lib/integrations/guest-app/types';

const FILE = 'guest-app-config.json';

export async function loadGuestAppConfig(): Promise<GuestAppConfig> {
  return loadJsonConfig(FILE, DEFAULT_GUEST_APP_CONFIG);
}

export async function saveGuestAppConfig(config: GuestAppConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function getPublicGuestAppInfo() {
  const config = await loadGuestAppConfig();
  return {
    ok: config.enabled,
    appName: config.appName,
    iosStoreUrl: config.iosStoreUrl,
    androidStoreUrl: config.androidStoreUrl,
    deepLinkScheme: config.deepLinkScheme,
    minAppVersion: config.minAppVersion,
    features: config.features,
    deepLinks: {
      guestPortal: `${config.deepLinkScheme}://guest`,
      checkIn: `${config.deepLinkScheme}://checkin`,
      folio: `${config.deepLinkScheme}://folio`,
      spa: `${config.deepLinkScheme}://spa`,
      activities: `${config.deepLinkScheme}://activities`,
    },
  };
}
