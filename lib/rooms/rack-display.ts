import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { PROPERTY } from '@/lib/navigation';
import type { Reservation } from '@/lib/types/reservation';
import type { RackCell } from '@/lib/types/room';

export type RackDisplayContext = {
  businessDate?: string;
  reservations?: Reservation[];
};

export type RackDisplayIcon = 'person' | 'clock' | 'hand' | 'wrench' | 'none';

export type RackDisplay = {
  label: string;
  sub?: string;
  time?: string;
  icon: RackDisplayIcon;
  color: string;
  text: string;
  border: string;
};

const TODAY = PROPERTY.businessDate;

function shortGuestName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]![0]}. ${parts[parts.length - 1]}`;
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

function arrivalToday(roomNo: string, ctx: RackDisplayContext) {
  const today = ctx.businessDate ?? TODAY;
  const reservations = ctx.reservations ?? DEMO_RESERVATIONS;
  return reservations.find(
    (r) =>
      r.roomNo === roomNo &&
      r.checkIn === today &&
      (r.status === 'CONFIRMED' || r.status === 'OPTION'),
  );
}

function futureOnRoom(roomNo: string, ctx: RackDisplayContext) {
  const today = ctx.businessDate ?? TODAY;
  const reservations = ctx.reservations ?? DEMO_RESERVATIONS;
  return reservations.find(
    (r) =>
      r.roomNo === roomNo &&
      r.checkIn > today &&
      (r.status === 'CONFIRMED' || r.status === 'OPTION'),
  );
}

export function getRackDisplay(cell: RackCell, ctx: RackDisplayContext = {}): RackDisplay {
  const { room, state, guestName } = cell;

  if (room.hkStatus === 'DND') {
    return {
      label: 'DND',
      sub: 'Rahatsız etmeyin',
      icon: 'hand',
      color: '#fecdd3',
      text: '#9f1239',
      border: '#fb7185',
    };
  }

  if (room.hkStatus === 'OOO' || state === 'ariza') {
    return {
      label: 'ARIZA',
      sub: room.specialInfo ?? 'Bakımda',
      icon: 'wrench',
      color: '#fee2e2',
      text: '#991b1b',
      border: '#f87171',
    };
  }

  if (room.hkStatus === 'OOS' || state === 'ooi') {
    return {
      label: 'OOI',
      sub: 'Kapalı',
      icon: 'wrench',
      color: '#e2e8f0',
      text: '#475569',
      border: '#94a3b8',
    };
  }

  const pendingArrival = !cell.occupied ? arrivalToday(room.roomNo, ctx) : undefined;
  if (pendingArrival) {
    return {
      label: 'GİRİŞ',
      sub: shortGuestName(pendingArrival.guestName),
      time: '14:00',
      icon: 'clock',
      color: '#dbeafe',
      text: '#1e40af',
      border: '#60a5fa',
    };
  }

  const future = !cell.occupied ? futureOnRoom(room.roomNo, ctx) : undefined;
  if (future) {
    return {
      label: 'REZERVE',
      sub: shortGuestName(future.guestName),
      time: formatShortDate(future.checkIn),
      icon: 'clock',
      color: '#ede9fe',
      text: '#5b21b6',
      border: '#a78bfa',
    };
  }

  if (state === 'checkout') {
    return {
      label: 'ÇIKIŞ',
      sub: shortGuestName(guestName),
      time: '11:00',
      icon: 'clock',
      color: '#ffedd5',
      text: '#9a3412',
      border: '#fb923c',
    };
  }

  if (state === 'dolu-temiz' || state === 'dolu-kirli' || state === 'onayli') {
    return {
      label: 'DOLU',
      sub: shortGuestName(guestName) || room.typeShort,
      icon: 'person',
      color: '#dcfce7',
      text: '#166534',
      border: '#4ade80',
    };
  }

  if (state === 'kirli') {
    return {
      label: 'BOŞ',
      sub: 'Kirli',
      icon: 'none',
      color: '#fef9c3',
      text: '#854d0e',
      border: '#facc15',
    };
  }

  return {
    label: 'BOŞ',
    sub: room.typeShort,
    icon: 'none',
    color: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
  };
}

export const RACK_DISPLAY_LEGEND: { label: string; color: string; text: string }[] = [
  { label: 'Dolu', color: '#dcfce7', text: '#166534' },
  { label: 'Boş', color: '#f1f5f9', text: '#475569' },
  { label: 'Giriş', color: '#dbeafe', text: '#1e40af' },
  { label: 'Çıkış', color: '#ffedd5', text: '#9a3412' },
  { label: 'Rezerve', color: '#ede9fe', text: '#5b21b6' },
  { label: 'DND', color: '#fecdd3', text: '#9f1239' },
  { label: 'Arıza', color: '#fee2e2', text: '#991b1b' },
];

export function getElektraStatusLabel(display: RackDisplay): string {
  const map: Record<string, string> = {
    DOLU: 'Konaklıyor',
    BOŞ: 'Boş',
    ÇIKIŞ: 'Çıkış Yaptı',
    GİRİŞ: 'Giriş',
    REZERVE: 'Rezerve',
    DND: 'DND',
    ARIZA: 'Bakımda',
    OOI: 'Kapalı',
  };
  return map[display.label] ?? display.label;
}

export function rackStatsFromCounts(counts: Record<string, number>, total: number) {
  const occupied = (counts['dolu-temiz'] ?? 0) + (counts['dolu-kirli'] ?? 0) + (counts.checkout ?? 0);
  const vacant = (counts.temiz ?? 0) + (counts.kirli ?? 0);
  const maint = (counts.ooi ?? 0) + (counts.ariza ?? 0);
  const inspect = (counts.onayli ?? 0);
  return { total, occupied, vacant, maint, inspect };
}
