export type GuestAppFeatures = {
  checkIn: boolean;
  folio: boolean;
  roomService: boolean;
  spa: boolean;
  activities: boolean;
  digitalKey: boolean;
};

export type GuestAppConfig = {
  enabled: boolean;
  appName: string;
  bundleId: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
  deepLinkScheme: string;
  pushEnabled: boolean;
  minAppVersion: string;
  features: GuestAppFeatures;
};

export const DEFAULT_GUEST_APP_CONFIG: GuestAppConfig = {
  enabled: true,
  appName: 'Roomio Guest',
  bundleId: 'com.roomio.guest',
  iosStoreUrl: 'https://apps.apple.com/app/roomio-guest',
  androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.roomio.guest',
  deepLinkScheme: 'roomio-guest',
  pushEnabled: true,
  minAppVersion: '2.1.0',
  features: {
    checkIn: true,
    folio: true,
    roomService: true,
    spa: true,
    activities: true,
    digitalKey: false,
  },
};
