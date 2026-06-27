export type SpaTreatment = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  currency: string;
  available: boolean;
};

export type SpaConfig = {
  enabled: boolean;
  hotelName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  treatments: SpaTreatment[];
};

export const DEFAULT_SPA_CONFIG: SpaConfig = {
  enabled: true,
  hotelName: 'Roomio Spa',
  openFrom: '09:00',
  openTo: '21:00',
  allowOnlineBooking: true,
  treatments: [
    { id: 'massage-60', name: 'Klasik Masaj (60 dk)', durationMinutes: 60, price: 1800, currency: 'TRY', available: true },
    { id: 'hamam', name: 'Türk Hamamı', durationMinutes: 45, price: 1200, currency: 'TRY', available: true },
    { id: 'facial', name: 'Cilt Bakımı', durationMinutes: 50, price: 1500, currency: 'TRY', available: true },
    { id: 'couple', name: 'Çift Masajı', durationMinutes: 90, price: 3200, currency: 'TRY', available: true },
  ],
};
