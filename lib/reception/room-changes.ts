import { reservationExtra } from '@/lib/reservations/list-tabs';
import type { Reservation } from '@/lib/types/reservation';

export type PlannedRoomChange = {
  reservation: Reservation;
  guestName: string;
  fromRoom: string;
  toRoom: string;
  changeDate: string;
  notes: string;
};

export function pickPlannedRoomChanges(reservations: Reservation[]): PlannedRoomChange[] {
  return reservations
    .map((r) => ({
      reservation: r,
      guestName: r.guestName,
      fromRoom: r.roomNo ?? '—',
      toRoom: reservationExtra(r, 'plannedRoomNo') || reservationExtra(r, 'newRoomNo'),
      changeDate: reservationExtra(r, 'roomChangeDate'),
      notes: reservationExtra(r, 'roomChangeNotes'),
    }))
    .filter((x) => x.toRoom && x.changeDate)
    .sort((a, b) => a.changeDate.localeCompare(b.changeDate));
}

export function isShareReservation(r: Reservation): boolean {
  return reservationExtra(r, 'shareRoom') === '1' || Boolean(reservationExtra(r, 'shareWith'));
}
