export type ViofunActivity = {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  currency: string;
  minAge?: number;
  available: boolean;
};

export type ViofunConfig = {
  enabled: boolean;
  apiKey: string;
  propertyCode: string;
  hotelName: string;
  allowGuestBooking: boolean;
  simulateWhenOffline: boolean;
  activities: ViofunActivity[];
};

export const DEFAULT_VIOFUN_CONFIG: ViofunConfig = {
  enabled: true,
  apiKey: '',
  propertyCode: '',
  hotelName: 'Roomio Hotel Activities',
  allowGuestBooking: true,
  simulateWhenOffline: true,
  activities: [
    { id: 'jetski', name: 'Jet Ski Turu', category: 'Su Sporları', durationMinutes: 30, price: 850, currency: 'TRY', minAge: 16, available: true },
    { id: 'parasailing', name: 'Parasailing', category: 'Su Sporları', durationMinutes: 20, price: 1200, currency: 'TRY', minAge: 14, available: true },
    { id: 'disco', name: 'Gece Diskosu', category: 'Eğlence', durationMinutes: 180, price: 350, currency: 'TRY', available: true },
    { id: 'kids-club', name: 'Mini Club (4-12)', category: 'Çocuk', durationMinutes: 120, price: 0, currency: 'TRY', minAge: 4, available: true },
    { id: 'boat-tour', name: 'Tekne Turu', category: 'Gezi', durationMinutes: 240, price: 1500, currency: 'TRY', available: true },
  ],
};

export type ViofunBooking = {
  id: string;
  activityId: string;
  activityName: string;
  guest: string;
  roomNo: string;
  date: string;
  time: string;
  party: number;
  status: 'Bekliyor' | 'Onaylı' | 'İptal';
  createdAt: string;
};
