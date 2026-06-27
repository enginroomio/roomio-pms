import type { PaymentCurrency } from '@/lib/exchange/types';

export type ReservationStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'OPTION'
  | 'CANCELLED'
  | 'NO_SHOW';

export type Reservation = {
  id: string;
  refNo: string;
  guestName: string;
  email?: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomNo?: string;
  adults: number;
  children: number;
  mealPlan: string;
  rate: number;
  currency: PaymentCurrency | string;
  agency: string;
  market: string;
  status: ReservationStatus;
  createdAt: string;
  notes?: string;
  groupId?: string;
  extraData?: Record<string, string>;
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Onaylı',
  CHECKED_IN: 'Konaklıyor',
  CHECKED_OUT: 'Ayrıldı',
  OPTION: 'Beklemede',
  CANCELLED: 'İptal',
  NO_SHOW: 'No Show',
};

export const ROOM_TYPES = ['SGL', 'DBL', 'TWN', 'TPL', 'SUI'] as const;
export const MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI'] as const;
