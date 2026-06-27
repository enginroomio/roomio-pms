/** TESA Hospitality 7.04.03 — HT24 Industry Standard Protocol (PMS Service TCP) */

import { allRoomNumbers } from '@/lib/rooms/room-config';

export const TESA_DEFAULTS = {
  softwareVersion: '7.04.03',
  host: '127.0.0.1',
  port: 7779,
  protocol: 'TCP' as const,
  messageProtocol: 'IndustryStandardProtocol' as const,
  removeWhiteSpaces: true,
  timeoutMs: 15000,
};

export type TesaConfig = {
  enabled: boolean;
  host: string;
  port: number;
  encoderPcId: string;
  encoderNumber: number;
  protocol: 'TCP' | 'UDP' | 'SSL';
  softwareVersion: string;
  simulateWhenOffline: boolean;
  roomMappings: Record<string, string>;
};

export type TesaEncodeRequest = {
  roomNo: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  keyCount?: number;
  reservationRef?: string;
};

export type TesaEncodeResult = {
  ok: boolean;
  simulated?: boolean;
  message: string;
  rawRequest?: string;
  rawResponse?: string;
  encodedAt?: string;
};

export const DEFAULT_TESA_CONFIG: TesaConfig = {
  enabled: true,
  host: TESA_DEFAULTS.host,
  port: TESA_DEFAULTS.port,
  encoderPcId: 'RECEPTION-PC',
  encoderNumber: 1,
  protocol: 'TCP',
  softwareVersion: TESA_DEFAULTS.softwareVersion,
  simulateWhenOffline: true,
  roomMappings: Object.fromEntries(allRoomNumbers().map((n) => [n, n])),
};
