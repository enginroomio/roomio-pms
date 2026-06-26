import type { RoomBlock } from '@/lib/data/room-blocks';
import type { Reservation, ReservationStatus } from '@/lib/types/reservation';

export type ReservationListTab =
  | 'waiting'
  | 'reservation'
  | 'inhouse'
  | 'departed'
  | 'cancelled'
  | 'noshow'
  | 'all'
  | 'deleted';

export const RESERVATION_LIST_TABS: { id: ReservationListTab; label: string; index: number }[] = [
  { id: 'waiting', label: 'Bekleme', index: 1 },
  { id: 'reservation', label: 'Rezervasyon', index: 2 },
  { id: 'inhouse', label: 'Konaklayan', index: 3 },
  { id: 'departed', label: 'Ayrılan', index: 4 },
  { id: 'cancelled', label: 'İptal', index: 5 },
  { id: 'noshow', label: 'NoShow', index: 6 },
  { id: 'all', label: 'Hepsi', index: 7 },
  { id: 'deleted', label: 'Silinenler', index: 8 },
];

const TAB_STATUS: Record<ReservationListTab, ReservationStatus | 'ALL' | 'DELETED'> = {
  waiting: 'OPTION',
  reservation: 'CONFIRMED',
  inhouse: 'CHECKED_IN',
  departed: 'CHECKED_OUT',
  cancelled: 'CANCELLED',
  noshow: 'NO_SHOW',
  all: 'ALL',
  deleted: 'DELETED',
};

export function filterByListTab<T extends { status: ReservationStatus }>(
  rows: T[],
  tab: ReservationListTab,
): T[] {
  const want = TAB_STATUS[tab];
  if (want === 'ALL') return rows.filter((r) => r.status !== 'CANCELLED');
  if (want === 'DELETED') return [];
  return rows.filter((r) => r.status === want);
}

export function countByListTab(reservations: Reservation[]): Record<ReservationListTab, number> {
  const base = {
    waiting: 0,
    reservation: 0,
    inhouse: 0,
    departed: 0,
    cancelled: 0,
    noshow: 0,
    all: 0,
    deleted: 0,
  };
  for (const r of reservations) {
    if (r.status === 'OPTION') base.waiting += 1;
    if (r.status === 'CONFIRMED') base.reservation += 1;
    if (r.status === 'CHECKED_IN') base.inhouse += 1;
    if (r.status === 'CHECKED_OUT') base.departed += 1;
    if (r.status === 'CANCELLED') base.cancelled += 1;
    if (r.status === 'NO_SHOW') base.noshow += 1;
    if (r.status !== 'CANCELLED') base.all += 1;
  }
  return base;
}

export type ReservationListRow =
  | { kind: 'reservation'; reservation: Reservation }
  | { kind: 'block'; block: RoomBlock };

/** Oda no sıralaması — boş odalar sonda. */
export function compareRoomNo(a: string | undefined, b: string | undefined): number {
  const ra = a?.trim() ?? '';
  const rb = b?.trim() ?? '';
  if (!ra && !rb) return 0;
  if (!ra) return 1;
  if (!rb) return -1;
  return ra.localeCompare(rb, undefined, { numeric: true });
}

/**
 * Rezervasyon + aktif blokaj satırlarını oda no'ya göre sıralar.
 * Aynı odada blokaj satırı her zaman ilgili rezervasyonların üstünde gelir;
 * oda numarası her satırda kendi hücresinde gösterilir (rowspan yok).
 */
export function buildReservationListRows(
  reservations: Reservation[],
  blocks: RoomBlock[] = [],
  options?: { includeBlocks?: boolean },
): ReservationListRow[] {
  const includeBlocks = options?.includeBlocks ?? true;
  const rows: ReservationListRow[] = reservations.map((reservation) => ({
    kind: 'reservation',
    reservation,
  }));

  if (includeBlocks) {
    for (const block of blocks) {
      if (block.status === 'active') {
        rows.push({ kind: 'block', block });
      }
    }
  }

  return rows.sort((a, b) => {
    const roomA = a.kind === 'block' ? a.block.roomNo : a.reservation.roomNo;
    const roomB = b.kind === 'block' ? b.block.roomNo : b.reservation.roomNo;
    const byRoom = compareRoomNo(roomA, roomB);
    if (byRoom !== 0) return byRoom;

    if (a.kind === 'block' && b.kind === 'reservation') return -1;
    if (a.kind === 'reservation' && b.kind === 'block') return 1;

    if (a.kind === 'block' && b.kind === 'block') {
      return a.block.from.localeCompare(b.block.from) || a.block.id.localeCompare(b.block.id);
    }

    if (a.kind === 'reservation' && b.kind === 'reservation') {
      return (
        a.reservation.checkIn.localeCompare(b.reservation.checkIn)
        || a.reservation.refNo.localeCompare(b.reservation.refNo)
      );
    }

    return 0;
  });
}

/** Blokaj satırı mevcut filtre/arama ile uyumlu mu? */
export function blockMatchesListFilters(
  block: RoomBlock,
  query: string,
  roomNosInView: Set<string>,
  listTab: ReservationListTab,
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [block.roomNo, block.reason, block.blockedBy].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (listTab !== 'all') return roomNosInView.has(block.roomNo);
  return true;
}

export function agencyCellTone(agencyOrCode: string): 'booking-nrf' | 'booking' | 'payment' | 'expedia' | 'tantur' | 'default' {
  const u = agencyOrCode.toUpperCase();
  if (u.includes('NRF') || u.includes('NON-REF')) return 'booking-nrf';
  if (u === 'BKG' || u.includes('BOOKING')) return 'booking';
  if (u === 'EXP' || u.includes('EXPEDIA')) return 'expedia';
  if (u === 'TNT' || u.includes('TANTUR')) return 'tantur';
  if (u.includes('ÖDEME') || u.includes('ODEME') || u.includes('PAYMENT')) return 'payment';
  return 'default';
}

export function reservationExtra(reservation: Reservation, key: string): string {
  const v = reservation.extraData?.[key];
  return v?.trim() ? v : '';
}
