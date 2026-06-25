export type BookingEngineConfig = {
  enabled: boolean;
  hotelName: string;
  headline: string;
  defaultRatePlan: string;
  defaultMealPlan: string;
  currency: string;
  allowVirtualPos: boolean;
  virtualPosProvider: string;
  requirePrepayment: boolean;
  prepaymentPercent: number;
  googleHotelEnabled: boolean;
  trivagoEnabled: boolean;
  loyaltyEnabled: boolean;
  simulateWhenOffline: boolean;
};

export const DEFAULT_BOOKING_ENGINE_CONFIG: BookingEngineConfig = {
  enabled: true,
  hotelName: 'Roomio Hotel',
  headline: 'Doğrudan rezervasyon — komisyonsuz, anında onay',
  defaultRatePlan: 'BAR',
  defaultMealPlan: 'BB',
  currency: 'TRY',
  allowVirtualPos: true,
  virtualPosProvider: 'roomio-sanal-pos',
  requirePrepayment: false,
  prepaymentPercent: 30,
  googleHotelEnabled: true,
  trivagoEnabled: true,
  loyaltyEnabled: true,
  simulateWhenOffline: true,
};

export type BookingAvailabilityDay = {
  date: string;
  roomType: string;
  available: number;
  rate: number;
  currency: string;
  mealPlan: string;
};

export type OnlineBookingRequest = {
  guestName: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  adults: number;
  children?: number;
  mealPlan?: string;
  paymentMethod?: 'card' | 'hotel';
  cardLast4?: string;
};

export type OnlineBookingResult = {
  ok: boolean;
  reservationId?: string;
  refNo?: string;
  guestPortalToken?: string;
  message: string;
  simulated?: boolean;
  totalAmount?: number;
  currency?: string;
};
