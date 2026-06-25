export type LiteMobileConfig = {
  enabled: boolean;
  appName: string;
  allowHousekeeping: boolean;
  allowMaintenance: boolean;
  allowGuestRequests: boolean;
  allowMinibar: boolean;
  offlineSync: boolean;
  minAppVersion: string;
};

export const DEFAULT_LITE_MOBILE_CONFIG: LiteMobileConfig = {
  enabled: true,
  appName: 'Lite Mobile',
  allowHousekeeping: true,
  allowMaintenance: true,
  allowGuestRequests: true,
  allowMinibar: true,
  offlineSync: true,
  minAppVersion: '3.0.0',
};
