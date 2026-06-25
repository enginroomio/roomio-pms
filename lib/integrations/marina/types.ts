export type MarinaBerth = {
  id: string;
  name: string;
  lengthM: number;
  widthM: number;
  depthM: number;
  dailyRate: number;
  currency: string;
  powerHookup: boolean;
  available: boolean;
};

export type MarinaConfig = {
  enabled: boolean;
  marinaName: string;
  totalBerths: number;
  allowOnlineBooking: boolean;
  checkInTime: string;
  checkOutTime: string;
  berths: MarinaBerth[];
};

export const DEFAULT_MARINA_CONFIG: MarinaConfig = {
  enabled: true,
  marinaName: 'Roomio Marina',
  totalBerths: 48,
  allowOnlineBooking: true,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  berths: [
    { id: 'a-01', name: 'Pier A-01', lengthM: 12, widthM: 4, depthM: 2.5, dailyRate: 1800, currency: 'TRY', powerHookup: true, available: true },
    { id: 'a-02', name: 'Pier A-02', lengthM: 15, widthM: 5, depthM: 3, dailyRate: 2400, currency: 'TRY', powerHookup: true, available: true },
    { id: 'b-01', name: 'Pier B-01', lengthM: 20, widthM: 6, depthM: 3.5, dailyRate: 3200, currency: 'TRY', powerHookup: true, available: true },
    { id: 'b-02', name: 'Pier B-02', lengthM: 25, widthM: 7, depthM: 4, dailyRate: 4500, currency: 'TRY', powerHookup: true, available: false },
  ],
};

export type MarinaBooking = {
  id: string;
  berthId: string;
  berthName: string;
  vesselName: string;
  captain: string;
  lengthM: number;
  arrival: string;
  departure: string;
  status: 'Bekliyor' | 'Onaylı' | 'İptal';
  createdAt: string;
};
