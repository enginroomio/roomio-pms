export type KioskConfig = {
  enabled: boolean;
  hotelName: string;
  allowIdScan: boolean;
  allowPayment: boolean;
  printRoomKey: boolean;
  languages: string[];
};

export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  enabled: true,
  hotelName: 'Roomio Hotel',
  allowIdScan: true,
  allowPayment: false,
  printRoomKey: true,
  languages: ['tr', 'en', 'de', 'ru'],
};
