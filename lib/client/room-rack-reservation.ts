import type { Reservation } from '@/lib/types/reservation';
import type { RackCell } from '@/lib/types/room';

export function getInHouseReservation(
  roomNo: string,
  reservations: Reservation[],
): Reservation | undefined {
  return reservations.find((r) => r.roomNo === roomNo && r.status === 'CHECKED_IN');
}

/** Bugün giriş yapılacak rezervasyon (oda atanmış veya atanmamış) */
export function getCheckInCandidate(
  roomNo: string,
  reservations: Reservation[],
  businessDate: string,
): Reservation | undefined {
  const assigned = reservations.find(
    (r) =>
      r.roomNo === roomNo &&
      r.checkIn === businessDate &&
      (r.status === 'CONFIRMED' || r.status === 'OPTION'),
  );
  if (assigned) return assigned;

  return reservations.find(
    (r) =>
      !r.roomNo &&
      r.checkIn === businessDate &&
      (r.status === 'CONFIRMED' || r.status === 'OPTION'),
  );
}

export function resolveCheckInInfoHref(
  cell: RackCell,
  inHouse?: Reservation,
  arrival?: Reservation,
): string {
  if (inHouse) return `/reception/guest/${inHouse.id}`;
  if (arrival) return `/reception/check-in/${arrival.id}`;
  return `/rooms?focus=${encodeURIComponent(cell.room.roomNo)}`;
}

/** null → API ile check-in yapılabilir */
export function resolveWalkInCheckInHref(
  cell: RackCell,
  arrival: Reservation | undefined,
  businessDate: string,
): string | null {
  if (arrival) return null;
  const params = new URLSearchParams({
    fixRoomNo: cell.room.roomNo,
    checkIn: businessDate,
  });
  return `/reservations/new?${params.toString()}`;
}

/** null → API ile check-out yapılabilir */
export function resolveCheckOutHref(inHouse: Reservation | undefined, roomNo: string): string | null {
  if (inHouse) return null;
  return `/reception/departures?room=${encodeURIComponent(roomNo)}`;
}
