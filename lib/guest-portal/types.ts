/** Misafir panelinde gösterilen hizmet bağlantıları — otel istemediği ekranı kapatabilir. */
export type GuestServiceKey =
  | 'restaurant'
  | 'carbon'
  | 'spa'
  | 'gym'
  | 'fair'
  | 'hotel'
  | 'viofun'
  | 'menu'
  | 'roomService';

export type GuestServiceLinksConfig = Record<GuestServiceKey, boolean>;

export const DEFAULT_GUEST_SERVICE_LINKS: GuestServiceLinksConfig = {
  restaurant: true,
  carbon: true,
  spa: true,
  gym: true,
  fair: true,
  hotel: true,
  viofun: true,
  menu: true,
  roomService: true,
};

export type GuestPortalConfig = {
  enabled: boolean;
  allowOnlineCheckIn: boolean;
  allowFolioView: boolean;
  allowEinvoiceRequest: boolean;
  allowServiceRequests: boolean;
  qrCheckInEnabled: boolean;
  tokenTtlHours: number;
  serviceLinks: GuestServiceLinksConfig;
};

export const DEFAULT_GUEST_PORTAL_CONFIG: GuestPortalConfig = {
  enabled: true,
  allowOnlineCheckIn: true,
  allowFolioView: true,
  allowEinvoiceRequest: true,
  allowServiceRequests: true,
  qrCheckInEnabled: true,
  tokenTtlHours: 72,
  serviceLinks: DEFAULT_GUEST_SERVICE_LINKS,
};

export type GuestPortalTokenPayload = {
  reservationId: string;
  refNo: string;
  email: string;
  propertyId: string;
};

export type GuestPortalSession = {
  ok: boolean;
  message?: string;
  reservation?: {
    id: string;
    refNo: string;
    guestName: string;
    email?: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    roomNo?: string;
    status: string;
    rate: number;
    currency: string;
  };
  folio?: {
    balance: number;
    lines: Array<{ date: string; description: string; amount: number; type: string }>;
  };
  features?: GuestPortalConfig;
};
