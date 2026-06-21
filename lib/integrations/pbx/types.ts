/** Grandstream UCM6301 — HTTPS API + PMS API (otel santral) */

import { allRoomNumbers } from '@/lib/rooms/room-config';

export const UCM6301_DEFAULTS = {
  model: 'UCM6301',
  manufacturer: 'Grandstream',
  apiPort: 8089,
  apiVersion: '1.0',
  apiUser: 'cdrapi',
  timeoutMs: 15000,
};

/** PMS oda durumu — UCM6300 firmware varsayılanları */
export const UCM_ROOM_STATUS = {
  available: '1',
  cleaning: '2',
  repairing: '3',
  vacant: '4',
  dirty: '5',
  closed: '6',
} as const;

export type UcmRoomStatus = keyof typeof UCM_ROOM_STATUS;

export type PbxConfig = {
  enabled: boolean;
  /** UCM web/API IP (ör. 192.168.1.50) */
  host: string;
  port: number;
  /** HTTPS API kullanıcı (Value-Added → API Configuration) */
  apiUsername: string;
  apiPassword: string;
  /** PMS modül kullanıcı (Value-Added → PMS → Basic Settings) */
  pmsUsername: string;
  pmsPassword: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  simulateWhenOffline: boolean;
  /** Roomio oda no → UCM extension (varsayılan birebir) */
  extensionMappings: Record<string, string>;
  /** Check-in'de misafir adını dahili ekranda göster */
  syncDisplayName: boolean;
  /** Check-in'de oda hattını aktif et */
  enableExtensionOnCheckIn: boolean;
  /** Resepsiyon check-in'de otomatik santral güncelle */
  autoOnCheckIn: boolean;
  /** Resepsiyon check-out'ta otomatik santral güncelle */
  autoOnCheckOut: boolean;
};

export type PbxGuestRequest = {
  roomNo: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  language?: string;
  vipCode?: string;
};

export type PbxActionResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  rawRequest?: string;
  rawResponse?: string;
};

export const DEFAULT_PBX_CONFIG: PbxConfig = {
  enabled: true,
  host: '192.168.1.50',
  port: UCM6301_DEFAULTS.apiPort,
  apiUsername: 'cdrapi',
  apiPassword: '',
  pmsUsername: 'pms',
  pmsPassword: '',
  model: UCM6301_DEFAULTS.model,
  serialNumber: '',
  macAddress: 'EC74D7757280',
  simulateWhenOffline: true,
  extensionMappings: Object.fromEntries(allRoomNumbers().map((n) => [n, n])),
  syncDisplayName: true,
  enableExtensionOnCheckIn: true,
  autoOnCheckIn: true,
  autoOnCheckOut: true,
};
