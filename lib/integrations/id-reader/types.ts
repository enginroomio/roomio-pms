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
};

export const DEFAULT_ID_READER_CONFIG: IdReaderConfig = {
  enabled: true,
  autoFillOnCheckIn: true,
  maskIdNumbers: true,
  simulateWhenOffline: true,
  devices: [
    { id: 'd1', name: 'Kimlikokur Pro — Resepsiyon', type: 'both', connection: 'usb', enabled: true },
    { id: 'd2', name: 'Kimlikokur Pro — Kiosk', type: 'both', connection: 'network', host: '192.168.1.50', enabled: true },
  ],
};

export type IdScanResult = {
  ok: boolean;
  message: string;
  data?: {
    firstName: string;
    lastName: string;
    nationality: string;
    documentNo: string;
    birthDate: string;
    gender: string;
  };
  simulated?: boolean;
};
