import type { Reservation } from '@/lib/types/reservation';

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
