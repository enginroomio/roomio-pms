import { DEMO_RESERVATIONS, formatDate, formatMoney } from '@/lib/data/reservations';
import type { Reservation } from '@/lib/types/reservation';
import { PROPERTY } from '@/lib/navigation';
import { getVacantRooms as buildVacantRooms } from '@/lib/rooms/inventory';

export type FolioLine = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'charge' | 'payment';
};

export type InHouseGuest = Reservation & {
  folioBalance: number;
  folioLines: FolioLine[];
  nights: number;
};

const TODAY = PROPERTY.businessDate;

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function demoFolio(r: Reservation): { balance: number; lines: FolioLine[] } {
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const roomTotal = r.rate * Math.min(nights, 2);
  const lines: FolioLine[] = [
    { id: '1', date: r.checkIn, description: `Konaklama ${r.roomType}`, amount: roomTotal, type: 'charge' },
  ];
  if (r.mealPlan !== 'RO') {
    lines.push({ id: '2', date: r.checkIn, description: `Pansiyon ${r.mealPlan}`, amount: 450 * r.adults, type: 'charge' });
  }
  if (r.id === '1') {
    lines.push({ id: '3', date: r.checkIn, description: 'Minibar', amount: 320, type: 'charge' });
    lines.push({ id: '4', date: r.checkIn, description: 'Nakit tahsilat', amount: 2000, type: 'payment' });
  }
  const charges = lines.filter((l) => l.type === 'charge').reduce((s, l) => s + l.amount, 0);
  const payments = lines.filter((l) => l.type === 'payment').reduce((s, l) => s + l.amount, 0);
  return { balance: charges - payments, lines };
}

export function enrichInHouse(r: Reservation): InHouseGuest {
  const { balance, lines } = demoFolio(r);
  return { ...r, folioBalance: balance, folioLines: lines, nights: nightsBetween(r.checkIn, r.checkOut) };
}

export function getInHouseGuests(): InHouseGuest[] {
  return DEMO_RESERVATIONS.filter((r) => r.status === 'CHECKED_IN').map(enrichInHouse);
}

export function getTodayArrivals(): Reservation[] {
  return DEMO_RESERVATIONS.filter((r) => r.checkIn === TODAY && (r.status === 'CONFIRMED' || r.status === 'OPTION'));
}

export function getTodayDepartures(): InHouseGuest[] {
  return DEMO_RESERVATIONS.filter((r) => r.checkOut === TODAY && r.status === 'CHECKED_IN').map(enrichInHouse);
}

export type VacantRoom = {
  roomNo: string;
  floor: number;
  type: string;
  status: 'CLEAN' | 'DIRTY';
};

export const VACANT_ROOMS: VacantRoom[] = buildVacantRooms();

export function getReservationForReception(id: string): Reservation | undefined {
  return DEMO_RESERVATIONS.find((r) => r.id === id);
}

export { formatDate, formatMoney, TODAY };
