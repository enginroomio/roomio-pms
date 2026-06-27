import type { EgmIdType } from '@/lib/egm/types';

export type IdReaderDevice = {
  id: string;
  name: string;
  type: 'passport' | 'id_card' | 'both';
  connection: 'usb' | 'network';
  host?: string;
  enabled: boolean;
};

export type IdReaderConfig = {
  enabled: boolean;
  autoFillOnCheckIn: boolean;
  maskIdNumbers: boolean;
  devices: IdReaderDevice[];
  simulateWhenOffline: boolean;
  /** Personel onayı olmadan check-in engelle */
  requireManualApproval: boolean;
  /** EGM alanları tamamlanmadan check-in engelle */
  blockCheckInUntilReady: boolean;
  /** Onay sonrası EGM gateway'e otomatik gönder */
  autoSendEgmAfterCheckIn: boolean;
};

export const DEFAULT_ID_READER_CONFIG: IdReaderConfig = {
  enabled: true,
  autoFillOnCheckIn: true,
  maskIdNumbers: true,
  simulateWhenOffline: true,
  requireManualApproval: true,
  blockCheckInUntilReady: true,
  autoSendEgmAfterCheckIn: true,
  devices: [
    { id: 'd1', name: 'Kimlikokur Pro — Resepsiyon', type: 'both', connection: 'usb', enabled: true },
    { id: 'd2', name: 'Kimlikokur Pro — Kiosk', type: 'both', connection: 'network', host: '192.168.1.50', enabled: true },
  ],
};

/** Kimlikokur gateway / cihaz tarama çıktısı */
export type IdScanDocument = {
  firstName: string;
  lastName: string;
  nationality: string;
  documentNo: string;
  idType?: EgmIdType;
  birthDate: string;
  birthPlace?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  issueDate?: string;
  expiryDate?: string;
  mrz?: string;
  confidence?: number;
  documentImageBase64?: string;
};

export type IdScanResult = {
  ok: boolean;
  message: string;
  data?: IdScanDocument;
  simulated?: boolean;
  deviceId?: string;
  deviceName?: string;
  validation?: {
    ok: boolean;
    score: number;
    errors: string[];
    warnings: string[];
  };
};

export type KimlikokurGatewayScanResponse = {
  ok: boolean;
  message?: string;
  document?: Partial<IdScanDocument>;
  confidence?: number;
  raw?: unknown;
};
