import { loadGuestPortalConfig } from '@/lib/guest-portal/client';
import { verifyGuestPortalToken } from '@/lib/guest-portal/tokens';
import type { GuestPortalSession } from '@/lib/guest-portal/types';
import { getFolioLinesServer } from '@/lib/server/folio-cash';
import {
  getAllReservationsServer,
  getReservationByIdServer,
  updateReservationServer,
} from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

export async function lookupGuestSession(input: {
  token?: string;
  refNo?: string;
  email?: string;
  propertyId?: string;
}): Promise<GuestPortalSession> {
  const config = await loadGuestPortalConfig();
  if (!config.enabled) {
    return { ok: false, message: 'Misafir portalı kapalı' };
  }

  const propertyId = input.propertyId ?? DEFAULT_PROPERTY_ID;
  let reservationId: string | undefined;

  if (input.token) {
    const payload = await verifyGuestPortalToken(input.token);
    if (!payload) return { ok: false, message: 'Geçersiz veya süresi dolmuş bağlantı' };
    reservationId = payload.reservationId;
  } else if (input.refNo && input.email) {
    const rows = await getAllReservationsServer(propertyId);
    const match = rows.find(
      (r) =>
        r.refNo.toLowerCase() === input.refNo!.toLowerCase()
        && r.email?.toLowerCase() === input.email!.toLowerCase(),
    );
    if (!match) return { ok: false, message: 'Rezervasyon bulunamadı' };
    reservationId = match.id;
  } else {
    return { ok: false, message: 'token veya refNo+email gerekli' };
  }

  const reservation = await getReservationByIdServer(reservationId, propertyId);
  if (!reservation) return { ok: false, message: 'Rezervasyon bulunamadı' };

  const session: GuestPortalSession = {
    ok: true,
    reservation: {
      id: reservation.id,
      refNo: reservation.refNo,
      guestName: reservation.guestName,
      email: reservation.email,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      roomType: reservation.roomType,
      roomNo: reservation.roomNo,
      status: reservation.status,
      rate: reservation.rate,
      currency: reservation.currency,
    },
    features: config,
  };

  if (config.allowFolioView) {
    const lines = await getFolioLinesServer(reservation.id, propertyId, 'guest');
    const balance = lines.reduce(
      (s, l) => s + (l.type === 'payment' ? -l.amount : l.amount),
      0,
    );
    session.folio = {
      balance,
      lines: lines.map((l) => ({
        date: l.date,
        description: l.description,
        amount: l.amount,
        type: l.type,
      })),
    };
  }

  return session;
}

export async function performGuestCheckIn(
  token: string,
  notes?: string,
): Promise<{ ok: boolean; message: string }> {
  const config = await loadGuestPortalConfig();
  if (!config.enabled || !config.allowOnlineCheckIn) {
    return { ok: false, message: 'Online check-in kapalı' };
  }

  const payload = await verifyGuestPortalToken(token);
  if (!payload) return { ok: false, message: 'Geçersiz token' };

  const reservation = await getReservationByIdServer(payload.reservationId, payload.propertyId);
  if (!reservation) return { ok: false, message: 'Rezervasyon bulunamadı' };
  if (reservation.status === 'CHECKED_IN') {
    return { ok: true, message: 'Zaten check-in yapılmış' };
  }
  if (reservation.status === 'CANCELLED' || reservation.status === 'CHECKED_OUT') {
    return { ok: false, message: 'Bu rezervasyon için check-in yapılamaz' };
  }

  await updateReservationServer(
    reservation.id,
    {
      status: 'CHECKED_IN',
      notes: [reservation.notes, notes, 'Online check-in (misafir portalı)'].filter(Boolean).join(' · '),
    },
    payload.propertyId,
  );

  return { ok: true, message: 'Online check-in tamamlandı. İyi konaklamalar!' };
}
