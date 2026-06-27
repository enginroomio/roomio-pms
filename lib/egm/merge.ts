import type { EgmIdentityForm, EgmIdentityRecord, EgmNotifyStatus } from '@/lib/egm/types';
import { computeEgmStatus, splitGuestName } from '@/lib/egm/types';
import type { Reservation } from '@/lib/types/reservation';

export function mapDbStatus(raw: string, form: Partial<EgmIdentityForm>): EgmNotifyStatus {
  if (raw === 'sent') return 'sent';
  if (raw === 'error') return 'error';
  if (raw === 'ready') return 'ready';
  if (raw === 'draft') return 'draft';
  if (raw === 'missing') return 'missing';
  if (raw === 'pending') return computeEgmStatus(form);
  return computeEgmStatus(form);
}

export function reservationToEgmSeed(r: Reservation): Partial<EgmIdentityForm> {
  const { firstName, lastName } = splitGuestName(r.guestName);
  const extra = r.extraData ?? {};
  return {
    reservationId: r.id,
    refNo: r.refNo,
    firstName: extra.firstName ?? firstName,
    lastName: extra.lastName ?? lastName,
    roomNo: r.roomNo ?? '',
    nationality: extra.nationality ?? 'TR',
    idNo: extra.idNo ?? '',
    idType: (extra.idType as EgmIdentityForm['idType']) ?? 'TCKN',
    birthDate: extra.birthDate ?? '',
    birthPlace: extra.birthPlace ?? '',
    gender: (extra.gender as EgmIdentityForm['gender']) ?? '',
    fatherName: extra.fatherName ?? '',
    motherName: extra.motherName ?? '',
    checkIn: r.checkIn,
    checkOut: r.checkOut,
  };
}

export type ReservationEgmRow = {
  reservation: Reservation;
  egm?: EgmIdentityRecord;
  status: EgmNotifyStatus;
  missingFields: string[];
};

export function mergeReservationEgm(
  reservations: Reservation[],
  egmRecords: EgmIdentityRecord[],
): ReservationEgmRow[] {
  const byResId = new Map(egmRecords.filter((e) => e.reservationId).map((e) => [e.reservationId!, e]));
  const byRef = new Map(egmRecords.filter((e) => e.refNo).map((e) => [e.refNo!, e]));

  return reservations.map((reservation) => {
    const egm = byResId.get(reservation.id) ?? byRef.get(reservation.refNo);
    if (egm) {
      return {
        reservation,
        egm,
        status: egm.status,
        missingFields: [],
      };
    }
    const seed = reservationToEgmSeed(reservation);
    const status = computeEgmStatus(seed);
    return { reservation, status, missingFields: [] };
  });
}
