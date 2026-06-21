import type { Reservation } from '@/lib/types/reservation';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';

const STORAGE_KEY = 'roomio-extra-reservations-v1';

export function getExtraReservations(): Reservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Reservation[]) : [];
  } catch {
    return [];
  }
}

export function getAllReservations(): Reservation[] {
  return [...DEMO_RESERVATIONS, ...getExtraReservations()];
}

export function addReservation(reservation: Reservation): void {
  if (typeof window === 'undefined') return;
  const next = [...getExtraReservations(), reservation];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function nextRefNo(): string {
  const all = getAllReservations();
  const n = all.length + 1;
  return `RSV-2026-${String(n).padStart(4, '0')}`;
}
