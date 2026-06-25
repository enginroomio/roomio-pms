export type RestaurantTable = {
  id: string;
  name: string;
  seats: number;
  zone: string;
  available: boolean;
};

export type RestaurantBookingConfig = {
  enabled: boolean;
  restaurantName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  maxPartySize: number;
  tables: RestaurantTable[];
};

export const DEFAULT_RESTAURANT_BOOKING_CONFIG: RestaurantBookingConfig = {
  enabled: true,
  restaurantName: 'Roomio Restaurant',
  openFrom: '12:00',
  openTo: '23:00',
  allowOnlineBooking: true,
  maxPartySize: 12,
  tables: [
    { id: 't1', name: 'Masa 1', seats: 2, zone: 'Salon', available: true },
    { id: 't2', name: 'Masa 2', seats: 4, zone: 'Salon', available: true },
    { id: 't3', name: 'Masa 3', seats: 6, zone: 'Teras', available: true },
    { id: 't4', name: 'VIP 1', seats: 8, zone: 'VIP', available: true },
  ],
};
