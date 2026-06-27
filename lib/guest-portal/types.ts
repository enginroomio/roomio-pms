export type GuestPortalConfig = {
  enabled: boolean;
  allowOnlineCheckIn: boolean;
  allowFolioView: boolean;
  allowEinvoiceRequest: boolean;
  allowServiceRequests: boolean;
  qrCheckInEnabled: boolean;
  tokenTtlHours: number;
};

export const DEFAULT_GUEST_PORTAL_CONFIG: GuestPortalConfig = {
  enabled: true,
  allowOnlineCheckIn: true,
  allowFolioView: true,
  allowEinvoiceRequest: true,
  allowServiceRequests: true,
  qrCheckInEnabled: true,
  tokenTtlHours: 72,
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
