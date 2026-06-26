import type { ReservationStatus } from '@/lib/types/reservation';

export { MEAL_PLAN_LABELS, formatMealPlanList } from '@/lib/reservations/meal-plan-display';

export const ELEKTRA_STATUS: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  CONFIRMED: { label: 'Garantili', className: 'rez-status--guaranteed' },
  CHECKED_IN: { label: 'Giriş Yapıldı', className: 'rez-status--inhouse' },
  OPTION: { label: 'Beklemede (Opsiyon)', className: 'rez-status--option' },
  CANCELLED: { label: 'İptal', className: 'rez-status--cancelled' },
  CHECKED_OUT: { label: 'Ayrıldı', className: 'rez-status--out' },
  NO_SHOW: { label: 'No Show', className: 'rez-status--noshow' },
};

/** Rezervasyon listesi — üstteki durum sekmeleriyle aynı etiketler. */
export const REZ_LIST_STATUS: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  OPTION: { label: 'Bekleme', className: 'rez-status--option' },
  CONFIRMED: { label: 'Rezervasyon', className: 'rez-status--guaranteed' },
  CHECKED_IN: { label: 'Konaklayan', className: 'rez-status--inhouse' },
  CHECKED_OUT: { label: 'Ayrılan', className: 'rez-status--out' },
  CANCELLED: { label: 'İptal', className: 'rez-status--cancelled' },
  NO_SHOW: { label: 'NoShow', className: 'rez-status--noshow' },
};

export function formatGuestElektra(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name.toUpperCase();
  const last = parts.pop()!;
  return `${last.toUpperCase()}, ${parts.join(' ').toUpperCase()}`;
}

/** Rezervasyon listesi — ad soyad sırası korunur. */
export function formatGuestList(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).join(' ').toUpperCase();
}

export function formatRoomElektra(roomNo?: string, roomType?: string): string {
  if (!roomNo) return '—';
  return roomType ? `${roomNo} (${roomType})` : roomNo;
}

export function formatDateElektra(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
