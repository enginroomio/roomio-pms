import type { Reservation } from '@/lib/types/reservation';
import { AGENCY_CONTRACTS, MEAL_PLANS } from '@/lib/data/kurulus';
import { ROOM_TYPES } from '@/lib/rooms/room-types';

function agencyMeta(code: string) {
  const row = AGENCY_CONTRACTS.find((a) => a.code === code);
  return {
    agency: row?.name ?? code,
    market: code === 'DIR' ? 'FIT' : `OTA-${code}`,
    agencyCode: code,
  };
}

type DemoSeed = {
  id: string;
  refNo: string;
  guestName: string;
  email?: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomNo?: string;
  adults: number;
  children: number;
  mealPlan: string;
  rate: number;
  currency: string;
  agencyCode: string;
  status: Reservation['status'];
  createdAt: string;
  notes?: string;
  extra?: Record<string, string>;
};

function demo(seed: DemoSeed): Reservation {
  const { agencyCode, extra, ...rest } = seed;
  const meta = agencyMeta(agencyCode);
  return {
    ...rest,
    agency: meta.agency,
    market: meta.market,
    extraData: { agencyCode, ...extra },
  };
}

/** Elektra / Konaklama PMS uyumlu demo rezervasyon seti — ref no 1..N */
export const DEMO_RESERVATIONS: Reservation[] = [
  // Bekleme — oda yok
  demo({
    id: 'rez-01', refNo: '1', guestName: 'Emre Çelik', checkIn: '2026-07-05', checkOut: '2026-07-08',
    roomType: 'DBL', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'DIR', status: 'OPTION', createdAt: '2026-06-20',
    extra: { createdBy: 'Can Demir', nationality: 'TR' },
  }),
  demo({
    id: 'rez-02', refNo: '2', guestName: 'Julia Becker', email: 'j.becker@mail.de', checkIn: '2026-07-12', checkOut: '2026-07-15',
    roomType: 'TWN', adults: 2, children: 0, mealPlan: 'HB', rate: 5200, currency: 'TRY',
    agencyCode: 'TUI', status: 'OPTION', createdAt: '2026-06-21',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'DE', voucherNo: 'TUI-88421' },
  }),
  // Rezervasyon — karışık oda
  demo({
    id: 'rez-03', refNo: '3', guestName: 'Ayşe Yılmaz', email: 'ayse.yilmaz@email.com', phone: '+90 532 111 2233',
    checkIn: '2026-06-25', checkOut: '2026-06-28', roomType: 'DBL', roomNo: '312', adults: 2, children: 0,
    mealPlan: 'BB', rate: 5200, currency: 'TRY', agencyCode: 'BKG', status: 'CONFIRMED', createdAt: '2026-06-10',
    extra: { createdBy: 'Can Demir', nationality: 'TR', voucherNo: 'BKG-442901' },
  }),
  demo({
    id: 'rez-04', refNo: '4', guestName: 'Merve Koç', checkIn: '2026-06-26', checkOut: '2026-06-29',
    roomType: 'TWN', adults: 2, children: 1, mealPlan: 'HB', rate: 5200, currency: 'TRY',
    agencyCode: 'EXP', status: 'CONFIRMED', createdAt: '2026-06-16',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'TR', voucherNo: 'EXP-77102' },
  }),
  demo({
    id: 'rez-05', refNo: '5', guestName: 'Anna Schmidt', checkIn: '2026-06-28', checkOut: '2026-07-03',
    roomType: 'SUI', roomNo: '506', adults: 2, children: 0, mealPlan: 'BB', rate: 12000, currency: 'TRY',
    agencyCode: 'DIR', status: 'CONFIRMED', createdAt: '2026-06-12', notes: 'VIP — üst kat tercih',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'DE' },
  }),
  demo({
    id: 'rez-06', refNo: '6', guestName: 'Can Arslan', checkIn: '2026-06-22', checkOut: '2026-06-24',
    roomType: 'DBL', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'DIR', status: 'CONFIRMED', createdAt: '2026-06-17',
    extra: { createdBy: 'Can Demir', nationality: 'TR' },
  }),
  demo({
    id: 'rez-07', refNo: '7', guestName: 'Zeynep Ak', checkIn: '2026-06-24', checkOut: '2026-06-26',
    roomType: 'TWN', roomNo: '215', adults: 2, children: 0, mealPlan: 'HB', rate: 4800, currency: 'TRY',
    agencyCode: 'BKG', status: 'CONFIRMED', createdAt: '2026-06-16',
    extra: { createdBy: 'Can Demir', nationality: 'TR', voucherNo: 'BKG-551203' },
  }),
  demo({
    id: 'rez-08', refNo: '8', guestName: 'Marco Rossi', checkIn: '2026-06-27', checkOut: '2026-06-30',
    roomType: 'SGL', adults: 1, children: 0, mealPlan: 'RO', rate: 3500, currency: 'TRY',
    agencyCode: 'EXP', status: 'CONFIRMED', createdAt: '2026-06-17',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'IT', voucherNo: 'EXP-99201' },
  }),
  demo({
    id: 'rez-09', refNo: '9', guestName: 'Elena Popov', checkIn: '2026-07-01', checkOut: '2026-07-04',
    roomType: 'SUI', roomNo: '508', adults: 2, children: 0, mealPlan: 'FB', rate: 14500, currency: 'TRY',
    agencyCode: 'TNT', status: 'CONFIRMED', createdAt: '2026-06-14',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'RU', voucherNo: 'TNT-3301' },
  }),
  demo({
    id: 'rez-10', refNo: '10', guestName: 'Thomas Klein', checkIn: '2026-07-02', checkOut: '2026-07-05',
    roomType: 'DBL', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'TUI', status: 'CONFIRMED', createdAt: '2026-06-15',
    extra: { createdBy: 'Can Demir', nationality: 'DE', voucherNo: 'TUI-12044' },
  }),
  demo({
    id: 'rez-11', refNo: '11', guestName: 'Selin Demir', checkIn: '2026-07-08', checkOut: '2026-07-10',
    roomType: 'TPL', adults: 3, children: 0, mealPlan: 'HB', rate: 6800, currency: 'TRY',
    agencyCode: 'DIR', status: 'CONFIRMED', createdAt: '2026-06-18',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'TR' },
  }),
  demo({
    id: 'rez-12', refNo: '12', guestName: 'James Miller', email: 'j.miller@corp.com', checkIn: '2026-07-10', checkOut: '2026-07-14',
    roomType: 'DBL', roomNo: '204', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'BKG', status: 'CONFIRMED', createdAt: '2026-06-19',
    extra: { createdBy: 'Can Demir', nationality: 'US', voucherNo: 'BKG-881204' },
  }),
  // Konaklayan
  demo({
    id: 'rez-13', refNo: '13', guestName: 'Fatma Kaya', checkIn: '2026-06-17', checkOut: '2026-06-20',
    roomType: 'DBL', roomNo: '104', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'DIR', status: 'CHECKED_IN', createdAt: '2026-06-01',
    extra: { createdBy: 'Can Demir', nationality: 'TR' },
  }),
  demo({
    id: 'rez-14', refNo: '14', guestName: 'Hans Weber', checkIn: '2026-06-18', checkOut: '2026-06-21',
    roomType: 'SGL', roomNo: '205', adults: 1, children: 0, mealPlan: 'RO', rate: 3500, currency: 'TRY',
    agencyCode: 'EXP', status: 'CHECKED_IN', createdAt: '2026-06-10',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'DE', voucherNo: 'EXP-44012' },
  }),
  demo({
    id: 'rez-15', refNo: '15', guestName: 'Sarah Johnson', checkIn: '2026-06-18', checkOut: '2026-06-22',
    roomType: 'TWN', roomNo: '118', adults: 2, children: 0, mealPlan: 'HB', rate: 5200, currency: 'TRY',
    agencyCode: 'BKG', status: 'CHECKED_IN', createdAt: '2026-06-11',
    extra: { createdBy: 'Can Demir', nationality: 'US', voucherNo: 'BKG-220981' },
  }),
  demo({
    id: 'rez-16', refNo: '16', guestName: 'Ali Öztürk', checkIn: '2026-06-18', checkOut: '2026-06-19',
    roomType: 'TPL', roomNo: '112', adults: 3, children: 1, mealPlan: 'HB', rate: 6800, currency: 'TRY',
    agencyCode: 'TNT', status: 'CHECKED_IN', createdAt: '2026-06-17',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'TR', voucherNo: 'TNT-8812' },
  }),
  // Ayrılan
  demo({
    id: 'rez-17', refNo: '17', guestName: 'Deniz Aktaş', checkIn: '2026-06-14', checkOut: '2026-06-17',
    roomType: 'DBL', roomNo: '109', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'DIR', status: 'CHECKED_OUT', createdAt: '2026-06-05',
    extra: { createdBy: 'Can Demir', nationality: 'TR' },
  }),
  demo({
    id: 'rez-18', refNo: '18', guestName: 'Pierre Dubois', checkIn: '2026-06-15', checkOut: '2026-06-17',
    roomType: 'SGL', roomNo: '116', adults: 1, children: 0, mealPlan: 'RO', rate: 3500, currency: 'TRY',
    agencyCode: 'EXP', status: 'CHECKED_OUT', createdAt: '2026-06-08',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'FR', voucherNo: 'EXP-55102' },
  }),
  demo({
    id: 'rez-19', refNo: '19', guestName: 'Gülşen Yıldız', checkIn: '2026-06-16', checkOut: '2026-06-18',
    roomType: 'DBL', roomNo: '210', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'BKG', status: 'CHECKED_OUT', createdAt: '2026-06-09',
    extra: { createdBy: 'Can Demir', nationality: 'TR', voucherNo: 'BKG-99102' },
  }),
  demo({
    id: 'rez-20', refNo: '20', guestName: 'Ivan Petrov', checkIn: '2026-06-12', checkOut: '2026-06-15',
    roomType: 'TWN', roomNo: '305', adults: 2, children: 0, mealPlan: 'HB', rate: 5200, currency: 'TRY',
    agencyCode: 'TUI', status: 'CHECKED_OUT', createdAt: '2026-06-03',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'RU', voucherNo: 'TUI-44019' },
  }),
  // İptal / NoShow
  demo({
    id: 'rez-21', refNo: '21', guestName: 'Leyla Şahin', checkIn: '2026-06-20', checkOut: '2026-06-22',
    roomType: 'DBL', adults: 2, children: 0, mealPlan: 'BB', rate: 5200, currency: 'TRY',
    agencyCode: 'BKG', status: 'CANCELLED', createdAt: '2026-06-08',
    extra: { createdBy: 'Can Demir', nationality: 'TR' },
  }),
  demo({
    id: 'rez-22', refNo: '22', guestName: 'Michael Brown', checkIn: '2026-06-16', checkOut: '2026-06-18',
    roomType: 'SGL', adults: 1, children: 0, mealPlan: 'RO', rate: 3500, currency: 'TRY',
    agencyCode: 'EXP', status: 'NO_SHOW', createdAt: '2026-06-10',
    extra: { createdBy: 'Arda Yılmaz', nationality: 'GB', voucherNo: 'EXP-22001' },
  }),
];

export const DEMO_ROOM_TYPE_CODES = Object.keys(ROOM_TYPES);
export const DEMO_MEAL_PLAN_CODES = MEAL_PLANS.filter((m) => m.active).map((m) => m.code);

export function getReservation(id: string): Reservation | undefined {
  return DEMO_RESERVATIONS.find((r) => r.id === id);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function formatMoney(amount: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: currency === 'TRY' ? 'currency' : 'decimal',
    currency: currency === 'TRY' ? 'TRY' : undefined,
    maximumFractionDigits: currency === 'TRY' ? 0 : 2,
  }).format(amount) + (currency !== 'TRY' ? ` ${currency}` : '');
}

export function nextRefNo(): string {
  return String(DEMO_RESERVATIONS.length + 1);
}
