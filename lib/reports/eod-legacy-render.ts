import { getTodayArrivals, getTodayDepartures, getInHouseGuests, TODAY } from '@/lib/data/reception';
import type { Reservation } from '@/lib/types/reservation';
import type { EodLegacyReportDef } from './eod-legacy-catalog';
import { renderBatchEodReport } from './eod-legacy-batch-render';
import { renderReportAsTable } from './eod-legacy-table-render';
import {
  type LegacyRenderContext,
  pad,
  fmtShortDate,
  fmtFullDate,
  fmtMoney,
  reportHeader,
  reportHeaderRoomPrice,
  addDaysIso,
} from './eod-legacy-render-utils';

export type { LegacyRenderContext };
export { pad, fmtShortDate, fmtFullDate, fmtMoney, reportHeader, reportHeaderRoomPrice, addDaysIso };

function fmtTime(iso?: string): string {
  if (!iso) return '12:00';
  const t = iso.includes('T') ? iso.split('T')[1] : iso;
  return t.slice(0, 5);
}

function columnHeaderArrivals(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Vip', 4) +
      pad('Rpt', 4) +
      pad('I. Misafir', 30) +
      pad('C/In', 7) +
      pad('Saati', 6) +
      pad('C/Out', 7) +
      pad('Ytak', 5) +
      pad('Çck1', 5) +
      pad('Çck2', 5) +
      pad('Toplam', 7) +
      pad('Bbk', 4) +
      pad('Psn', 4) +
      'Not',
    '-'.repeat(118),
  ].join('\n');
}

type ArrivalRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  adults: number;
  children: number;
  board: string;
  note: string;
};

const DEMO_ARRIVAL_ROWS: ArrivalRow[] = [
  {
    roomNo: '208',
    roomType: 'DEL',
    agency: 'BOOKING-ME',
    guestName: 'ABDULLA ALAMERI / IBRAHIM WISAMALDIN',
    checkIn: '2026-06-27',
    checkOut: '2026-07-05',
    adults: 2,
    children: 0,
    board: 'BB',
    note: 'D.O NRE ONLY',
  },
  {
    roomNo: '306',
    roomType: 'STD',
    agency: 'V.IHT',
    guestName: 'ESCALADA NAPOLETANA SRL',
    checkIn: '2026-06-27',
    checkOut: '2026-06-30',
    adults: 3,
    children: 0,
    board: 'BB',
    note: '',
  },
  {
    roomNo: '819',
    roomType: 'DSU',
    agency: 'ATRIP-GTI',
    guestName: 'JOACHIM SCHMITT',
    checkIn: '2026-06-27',
    checkOut: '2026-07-01',
    adults: 3,
    children: 0,
    board: 'BB',
    note: '',
  },
];

function reservationToArrivalRow(r: Reservation): ArrivalRow {
  const adults = r.adults ?? 1;
  const children = r.children ?? 0;
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    checkInTime: r.extraData?.arrivalTime,
    adults,
    children,
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    note: (r.notes ?? '').slice(0, 14).toUpperCase(),
  };
}

function renderArrivalRow(row: ArrivalRow): string {
  const total = row.adults + row.children;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad('', 4) +
    pad('', 4) +
    pad(row.guestName, 30) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtTime(row.checkInTime), 6) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.children), 5, 'right') +
    pad('0', 5, 'right') +
    pad(String(total), 7, 'right') +
    pad('0', 4, 'right') +
    pad(row.board, 4) +
    row.note
  );
}

function renderGr101(ctx: LegacyRenderContext): string {
  const arrivals = getTodayArrivals(ctx.reservations, ctx.businessDate);
  const rows = arrivals.length > 0 ? arrivals.map(reservationToArrivalRow) : DEMO_ARRIVAL_ROWS;
  const lines = [
    ...reportHeader(ctx, 'Günlük Giriş Listesi'),
    columnHeaderArrivals(),
    ...rows.map(renderArrivalRow),
    '',
    '-'.repeat(118),
    pad(`Listelendi ${rows.length}`, 24) +
      pad('', 60) +
      pad(String(rows.reduce((s, r) => s + r.adults, 0)), 5, 'right') +
      pad('', 5) +
      pad('', 5) +
      pad(String(rows.reduce((s, r) => s + r.adults + r.children, 0)), 7, 'right'),
  ];
  return lines.join('\n');
}

function renderGuestList(ctx: LegacyRenderContext, title: string, guests: Reservation[]): string {
  const lines = [
    ...reportHeader(ctx, title),
    pad('Oda', 6) + pad('Misafir', 36) + pad('Giriş', 8) + pad('Çıkış', 8) + pad('Acenta', 14) + 'Durum',
    '-'.repeat(90),
  ];
  const list = guests.length > 0 ? guests : ctx.reservations.slice(0, 5);
  for (const g of list) {
    lines.push(
      pad(g.roomNo ?? '—', 6) +
        pad(g.guestName.toUpperCase(), 36) +
        pad(fmtShortDate(g.checkIn), 8) +
        pad(fmtShortDate(g.checkOut), 8) +
        pad((g.agency ?? '').slice(0, 14), 14) +
        g.status,
    );
  }
  lines.push('', '-'.repeat(90), `Listelendi ${list.length}`);
  return lines.join('\n');
}

function columnHeaderDepartures(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('VNO', 5) +
      pad('Acenta', 12) +
      pad('Rpt', 4) +
      pad('1.Misafir', 26) +
      pad('C/In', 7) +
      pad('C/Out Saati', 12) +
      pad('Ytk', 4) +
      pad('Çok1', 5) +
      pad('Çok2', 5) +
      pad('Toplam', 7) +
      pad('EŞekli', 7) +
      pad('D.FİYAT', 10, 'right') +
      pad('TAHSİLAT', 11, 'right') +
      pad('REZNO', 8) +
      'RN#',
    '-'.repeat(132),
  ].join('\n');
}

type DepartureRow = {
  roomNo: string;
  roomType: string;
  voucherNo: string;
  agency: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  checkOutTime?: string;
  adults: number;
  child1: number;
  child2: number;
  paymentType: string;
  roomPrice: number;
  collected: number;
  reservationNo: string;
  rn: string;
};

const DEMO_DEPARTURE_ROWS: DepartureRow[] = [
  { roomNo: '207', roomType: 'DBL', voucherNo: '', agency: 'WALKIN', rpt: '', guestName: 'SOTVALDIEV BOTIR', checkIn: '2026-06-24', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 70, collected: 195, reservationNo: 'R2401', rn: '' },
  { roomNo: '312', roomType: 'DBL', voucherNo: '', agency: 'W-IN TC', rpt: '', guestName: 'MARIA SCHMIDT', checkIn: '2026-06-22', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 1850, collected: 920, reservationNo: 'R2388', rn: '' },
  { roomNo: '405', roomType: 'TRP', voucherNo: '', agency: 'BOOKING-NR', rpt: '', guestName: 'JOHN ANDERSON', checkIn: '2026-06-20', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 2100, collected: 1105.45, reservationNo: 'R2360', rn: '' },
  { roomNo: '518', roomType: 'DBL', voucherNo: '', agency: 'BOOKING-NR', rpt: '', guestName: 'ELENA PETROVA', checkIn: '2026-06-23', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 1200, collected: 800, reservationNo: 'R2410', rn: '' },
  { roomNo: '621', roomType: 'DBL', voucherNo: '', agency: 'W-IN TC', rpt: '', guestName: 'KLAUS WEBER', checkIn: '2026-06-26', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 823.96, collected: 530, reservationNo: 'R2422', rn: '' },
  { roomNo: '704', roomType: 'DBL', voucherNo: '', agency: 'WALKIN', rpt: '', guestName: 'AHMET YILMAZ', checkIn: '2026-06-25', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, paymentType: 'SOLD', roomPrice: 500, collected: 500, reservationNo: 'R2395', rn: '' },
];

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

function reservationToDepartureRow(r: Reservation): DepartureRow {
  const adults = r.adults ?? 1;
  const children = r.children ?? 0;
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const roomPrice = r.rate * nights;
  const collected = Number(r.extraData?.collected ?? r.extraData?.tahsilat ?? roomPrice);
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    voucherNo: (r.extraData?.voucherNo ?? '').slice(0, 5),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    checkOutTime: r.extraData?.departureTime ?? '12:00',
    adults,
    child1: children > 0 ? children : 0,
    child2: 0,
    paymentType: (r.extraData?.paymentType ?? r.extraData?.folioType ?? 'SOLD').slice(0, 7).toUpperCase(),
    roomPrice,
    collected,
    reservationNo: (r.refNo ?? r.id).slice(0, 8),
    rn: (r.extraData?.rn ?? '').slice(0, 3),
  };
}

function renderDepartureRow(row: DepartureRow): string {
  const total = row.adults + row.child1 + row.child2;
  const checkOutSaati = `${fmtShortDate(row.checkOut)} ${fmtTime(row.checkOutTime)}`;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.voucherNo, 5) +
    pad(row.agency, 12) +
    pad(row.rpt, 4) +
    pad(row.guestName, 26) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(checkOutSaati, 12) +
    pad(String(row.adults), 4, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(total), 7, 'right') +
    pad(row.paymentType, 7) +
    pad(fmtMoney(row.roomPrice), 10, 'right') +
    pad(fmtMoney(row.collected), 11, 'right') +
    pad(row.reservationNo, 8) +
    row.rn
  );
}

function renderGr102(ctx: LegacyRenderContext): string {
  const departures = getTodayDepartures(ctx.reservations, ctx.businessDate);
  const rows = departures.length > 0 ? departures.map(reservationToDepartureRow) : DEMO_DEPARTURE_ROWS;
  const totalAdults = rows.reduce((s, r) => s + r.adults, 0);
  const totalPax = rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0);
  const totalPrice = rows.reduce((s, r) => s + r.roomPrice, 0);
  const totalCollected = rows.reduce((s, r) => s + r.collected, 0);
  const lines = [
    ...reportHeader(ctx, 'Günlük Çıkış Listesi'),
    columnHeaderDepartures(),
    ...rows.map(renderDepartureRow),
    '',
    '-'.repeat(132),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 54) +
      pad(String(totalAdults), 4, 'right') +
      pad('', 10) +
      pad(String(totalPax), 7, 'right') +
      pad('', 7) +
      pad(fmtMoney(totalPrice), 10, 'right') +
      pad(fmtMoney(totalCollected), 11, 'right'),
  ];
  return lines.join('\n');
}

type DepartureTodayRow = {
  roomNo: string;
  roomType: string;
  voucherNo: string;
  agency: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  checkOutTime?: string;
  adults: number;
  child1: number;
  child2: number;
  baby: number;
  board: string;
  folioType: string;
  total: number;
  collected: number;
  basePrice: number;
  exchangeRate: string;
  currency: string;
  reservationNo: string;
  billNo: string;
};

const DEMO_DEPARTURE_TODAY_ROWS: DepartureTodayRow[] = [
  { roomNo: '510', roomType: 'DBL', voucherNo: '', agency: 'BOOKING.COM-STD', rpt: '', guestName: 'CRISTOFORO D AMATO / VALERIA SAITTA', checkIn: '2026-06-24', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, baby: 0, board: 'BB', folioType: 'SOLD', total: 1240, collected: 1240, basePrice: 185, exchangeRate: '1,0000', currency: 'EURO', reservationNo: 'BK5101', billNo: 'B-8821' },
  { roomNo: '305', roomType: 'DBL', voucherNo: 'V-305', agency: 'BOOKING ODEME', rpt: '', guestName: 'MARCO ROSSI / GIULIA BIANCHI', checkIn: '2026-06-25', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 1, child2: 0, baby: 0, board: 'BB', folioType: 'SOLD', total: 890.5, collected: 890.5, basePrice: 165, exchangeRate: '1,0000', currency: 'EURO', reservationNo: 'BK3052', billNo: 'B-8822' },
  { roomNo: '308', roomType: 'DBL', voucherNo: '', agency: 'BOOKING ODEME', rpt: '', guestName: 'PIERRE DUBOIS', checkIn: '2026-06-26', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, baby: 0, board: 'BB', folioType: 'SOLD', total: 420, collected: 0, basePrice: 210, exchangeRate: '38,2500', currency: 'TL', reservationNo: 'BK3088', billNo: 'B-8823' },
  { roomNo: '302', roomType: 'DBL', voucherNo: '', agency: 'BOOKING-NRF-ONLY ROOM', rpt: '', guestName: 'ANNA KOWALSKI', checkIn: '2026-06-23', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, baby: 0, board: 'BB', folioType: 'SOLD', total: 1680, collected: 1680, basePrice: 420, exchangeRate: '1,0000', currency: 'EURO', reservationNo: 'BK3021', billNo: 'B-8824' },
  { roomNo: '401', roomType: 'DBL', voucherNo: '', agency: 'W-IN TC', rpt: '', guestName: 'HANS MUELLER', checkIn: '2026-06-22', checkOut: '2026-06-27', checkOutTime: '12:00', adults: 2, child1: 0, child2: 0, baby: 0, board: 'BB', folioType: 'SOLD', total: 2100, collected: 1950, basePrice: 420, exchangeRate: '1,0000', currency: 'EURO', reservationNo: 'WI4019', billNo: 'B-8825' },
];

function columnHeaderDeparturesToday(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('VNO', 5) +
      pad('Acenta', 18) +
      pad('Rpt', 4) +
      pad('1.Misafir', 28) +
      pad('C/In', 7) +
      pad('C/Out', 7) +
      pad('Saati', 6) +
      pad('Ytk', 4) +
      pad('Çck1', 5) +
      pad('Çck2', 5) +
      pad('Toplam', 7) +
      pad('Bbk', 4) +
      pad('Pan', 4) +
      pad('F.Sekli', 8) +
      pad('TOPLAM', 10, 'right') +
      pad('TAHSILAT', 10, 'right') +
      pad('G.FIYAT', 9, 'right') +
      pad('KUR', 9) +
      pad('DOVIZ', 6) +
      pad('REZNO', 8) +
      'BNo',
    '-'.repeat(150),
  ].join('\n');
}

function reservationToDepartureTodayRow(r: Reservation): DepartureTodayRow {
  const adults = r.adults ?? 1;
  const children = r.children ?? 0;
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const basePrice = r.rate;
  const total = basePrice * nights;
  const collected = Number(r.extraData?.collected ?? r.extraData?.tahsilat ?? total);
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    voucherNo: (r.extraData?.voucherNo ?? '').slice(0, 5),
    agency: (r.agency ?? 'DIRECT').toUpperCase(),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    checkOutTime: r.extraData?.departureTime ?? '12:00',
    adults,
    child1: children > 0 ? children : 0,
    child2: 0,
    baby: Number(r.extraData?.baby ?? 0),
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    folioType: (r.extraData?.folioType ?? 'SOLD').slice(0, 8).toUpperCase(),
    total,
    collected,
    basePrice,
    exchangeRate: (r.extraData?.exchangeRate ?? '1,0000').slice(0, 9),
    currency: (r.currency ?? 'TL').toString().slice(0, 6).toUpperCase(),
    reservationNo: (r.refNo ?? r.id).slice(0, 8),
    billNo: (r.extraData?.billNo ?? '').slice(0, 8),
  };
}

function renderDepartureTodayRow(row: DepartureTodayRow): string {
  const totalPax = row.adults + row.child1 + row.child2;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.voucherNo, 5) +
    pad(row.agency.slice(0, 18), 18) +
    pad(row.rpt, 4) +
    pad(row.guestName, 28) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(fmtTime(row.checkOutTime), 6) +
    pad(String(row.adults), 4, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(totalPax), 7, 'right') +
    pad(String(row.baby), 4, 'right') +
    pad(row.board, 4) +
    pad(row.folioType, 8) +
    pad(fmtMoney(row.total), 10, 'right') +
    pad(fmtMoney(row.collected), 10, 'right') +
    pad(fmtMoney(row.basePrice), 9, 'right') +
    pad(row.exchangeRate, 9) +
    pad(row.currency, 6) +
    pad(row.reservationNo, 8) +
    row.billNo
  );
}

function sumDepartureToday(rows: DepartureTodayRow[]) {
  return {
    count: rows.length,
    adults: rows.reduce((s, r) => s + r.adults, 0),
    pax: rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
    collected: rows.reduce((s, r) => s + r.collected, 0),
  };
}

function renderAgencySubtotal(agency: string, rows: DepartureTodayRow[]): string {
  const s = sumDepartureToday(rows);
  return (
    pad(`Adet: ${s.count}`, 24) +
    pad(agency.slice(0, 24), 24) +
    pad('', 28) +
    pad('', 20) +
    pad(String(s.adults), 4, 'right') +
    pad('', 10) +
    pad(String(s.pax), 7, 'right') +
    pad('', 16) +
    pad(fmtMoney(s.total), 10, 'right') +
    pad(fmtMoney(s.collected), 10, 'right')
  );
}

function renderGr1021(ctx: LegacyRenderContext): string {
  const departures = getTodayDepartures(ctx.reservations, ctx.businessDate);
  const rows = departures.length > 0 ? departures.map(reservationToDepartureTodayRow) : DEMO_DEPARTURE_TODAY_ROWS;

  const byAgency = new Map<string, DepartureTodayRow[]>();
  for (const row of rows) {
    const list = byAgency.get(row.agency) ?? [];
    list.push(row);
    byAgency.set(row.agency, list);
  }

  const lines: string[] = [
    ...reportHeader(ctx, 'Günlük Çıkış Listesi - BUGÜN'),
    columnHeaderDeparturesToday(),
  ];

  for (const [agency, group] of byAgency) {
    lines.push(pad(agency, 150));
    lines.push(...group.map(renderDepartureTodayRow));
    lines.push(renderAgencySubtotal(agency, group));
    lines.push('');
  }

  const grand = sumDepartureToday(rows);
  lines.push(
    '-'.repeat(150),
    pad(`Listelenen ${grand.count}`, 24) +
      pad('', 76) +
      pad(String(grand.adults), 4, 'right') +
      pad('', 10) +
      pad(String(grand.pax), 7, 'right') +
      pad('', 16) +
      pad(fmtMoney(grand.total), 10, 'right') +
      pad(fmtMoney(grand.collected), 10, 'right'),
  );
  return lines.join('\n');
}

function renderGr201(ctx: LegacyRenderContext): string {
  const inhouse = getInHouseGuests(ctx.reservations);
  const rows = inhouse.length > 0 ? inhouse.map(reservationToDailyGuestRow) : buildDemoDailyGuests();
  const totalAdults = rows.reduce((s, r) => s + r.adults, 0);
  const totalChild1 = rows.reduce((s, r) => s + r.child1, 0);
  const totalChild2 = rows.reduce((s, r) => s + r.child2, 0);
  const totalPax = rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0);
  const totalBaby = rows.reduce((s, r) => s + r.baby, 0);
  const lines = [
    ...reportHeader(ctx, 'Günlük Misafir Listesi'),
    columnHeaderDailyGuests(),
    ...rows.map(renderDailyGuestRow),
    '',
    '-'.repeat(130),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 38) +
      pad(String(totalAdults), 5, 'right') +
      pad(String(totalChild1), 5, 'right') +
      pad(String(totalChild2), 5, 'right') +
      pad(String(totalPax), 7, 'right') +
      pad(String(totalBaby), 4, 'right'),
  ];
  return lines.join('\n');
}

function renderGr202(ctx: LegacyRenderContext): string {
  const rows = getHuseCompGuests(ctx.reservations).map(reservationToHuseCompRow);
  const totalAdults = rows.reduce((s, r) => s + r.adults, 0);
  const totalChild1 = rows.reduce((s, r) => s + r.child1, 0);
  const totalChild2 = rows.reduce((s, r) => s + r.child2, 0);
  const totalPax = rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0);
  const totalBaby = rows.reduce((s, r) => s + r.baby, 0);
  const lines = [
    ...reportHeader(ctx, 'HUSE COMP FCOMP oda Listesi'),
    columnHeaderHuseComp(),
    ...rows.map(renderHuseCompRow),
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 38) +
      pad(String(totalAdults), 5, 'right') +
      pad(String(totalChild1), 5, 'right') +
      pad(String(totalChild2), 5, 'right') +
      pad(String(totalPax), 7, 'right') +
      pad(String(totalBaby), 4, 'right'),
  ];
  return lines.join('\n');
}

type HuseCompRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  stayForm: string;
  vip: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  child1: number;
  child2: number;
  baby: number;
  board: string;
  xbr: string;
  note: string;
};

function getHuseCompGuests(reservations: Reservation[]): Reservation[] {
  return reservations.filter((r) => {
    if (r.status !== 'CHECKED_IN' && r.status !== 'CONFIRMED') return false;
    const form = (r.extraData?.stayForm ?? r.extraData?.sekil ?? r.market ?? '').toUpperCase();
    if (/COMP|HUSE|HOUSE|FCOMP/.test(form)) return true;
    const agency = (r.agency ?? '').toUpperCase();
    if (/COMP|HUSE|HOUSE|FCOMP/.test(agency)) return true;
    return r.rate === 0;
  });
}

function columnHeaderHuseComp(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Kşekli', 7) +
      pad('Vip', 4) +
      pad('Rpt', 4) +
      pad('1.Misafir', 26) +
      pad('C/In', 7) +
      pad('C/Out', 7) +
      pad('Ytşk', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('Toplam', 7, 'right') +
      pad('Bbk', 4, 'right') +
      pad('Pan', 4) +
      pad('XBr', 6) +
      'Not',
    '-'.repeat(118),
  ].join('\n');
}

function reservationToHuseCompRow(r: Reservation): HuseCompRow {
  const adults = r.adults ?? 1;
  const child1 = r.children ?? 0;
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    stayForm: (r.extraData?.stayForm ?? r.extraData?.sekil ?? r.market ?? 'COMP').slice(0, 7).toUpperCase(),
    vip: (r.extraData?.vip ?? '').slice(0, 4),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    adults,
    child1,
    child2: 0,
    baby: Number(r.extraData?.baby ?? 0),
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    xbr: (r.extraData?.xbr ?? r.extraData?.crossRef ?? '').slice(0, 6),
    note: (r.notes ?? '').slice(0, 14).toUpperCase(),
  };
}

function renderHuseCompRow(row: HuseCompRow): string {
  const total = row.adults + row.child1 + row.child2;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad(row.stayForm, 7) +
    pad(row.vip, 4) +
    pad(row.rpt, 4) +
    pad(row.guestName, 26) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(total), 7, 'right') +
    pad(String(row.baby), 4, 'right') +
    pad(row.board, 4) +
    pad(row.xbr, 6) +
    row.note
  );
}

type DailyGuestRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  vip: string;
  bpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  child1: number;
  child2: number;
  baby: number;
  board: string;
  hsekli: string;
  confirmationNo: string;
  roomNote: string;
};

function buildDemoDailyGuests(): DailyGuestRow[] {
  const base: Omit<DailyGuestRow, 'child2'>[] = [
    { roomNo: '208', roomType: 'DBL', agency: 'BOOKING-NB', vip: '', bpt: '', guestName: 'ABDULLA ALAMERI / IBRAHIM WISAMALDIN', checkIn: '2026-06-27', checkOut: '2026-07-05', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.501', roomNote: '' },
    { roomNo: '213', roomType: 'DBL', agency: 'BOOKING-NB', vip: '', bpt: '', guestName: 'MARCO ROSSI / GIULIA BIANCHI', checkIn: '2026-06-25', checkOut: '2026-07-02', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.508', roomNote: 'TWIN' },
    { roomNo: '301', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'STEFANO SAMMARCO', checkIn: '2026-06-24', checkOut: '2026-07-01', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.512', roomNote: '' },
    { roomNo: '305', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'NURDAN TORUNN', checkIn: '2026-06-26', checkOut: '2026-07-03', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.515', roomNote: '' },
    { roomNo: '312', roomType: 'DBL', agency: 'W.INT', vip: '', bpt: '', guestName: 'ELENA PETROVA', checkIn: '2026-06-23', checkOut: '2026-06-30', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.520', roomNote: 'UÇUŞU GEÇİ' },
    { roomNo: '318', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'HANS MUELLER', checkIn: '2026-06-22', checkOut: '2026-06-29', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.524', roomNote: '' },
    { roomNo: '402', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'ANNA KOWALSKI', checkIn: '2026-06-27', checkOut: '2026-07-04', adults: 2, child1: 1, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.528', roomNote: 'BEBEK YATA' },
    { roomNo: '405', roomType: 'TRP', agency: 'EXPEDIA', vip: '', bpt: '', guestName: 'FAMILY GROUP C', checkIn: '2026-06-25', checkOut: '2026-07-02', adults: 2, child1: 1, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.531', roomNote: '' },
    { roomNo: '410', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'PIERRE DUBOIS', checkIn: '2026-06-26', checkOut: '2026-07-03', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.535', roomNote: '' },
    { roomNo: '415', roomType: 'DBL', agency: 'AGODA', vip: '', bpt: '', guestName: 'MARIA GARCIA', checkIn: '2026-06-24', checkOut: '2026-07-01', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.538', roomNote: '' },
    { roomNo: '502', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'JOHN SMITH', checkIn: '2026-06-27', checkOut: '2026-07-05', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.541', roomNote: '' },
    { roomNo: '508', roomType: 'DBL', agency: 'TUI', vip: '', bpt: '', guestName: 'KLAUS WEBER', checkIn: '2026-06-23', checkOut: '2026-06-30', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.544', roomNote: '' },
    { roomNo: '512', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'SOPHIE MARTIN', checkIn: '2026-06-25', checkOut: '2026-07-02', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.547', roomNote: '' },
    { roomNo: '601', roomType: 'DBL', agency: 'DIRECT', vip: '', bpt: '', guestName: 'AHMET YILMAZ', checkIn: '2026-06-26', checkOut: '2026-07-01', adults: 1, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.550', roomNote: '' },
    { roomNo: '607', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'DAVID BROWN', checkIn: '2026-06-22', checkOut: '2026-06-29', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.553', roomNote: '' },
    { roomNo: '612', roomType: 'DBL', agency: 'W.INT', vip: '', bpt: '', guestName: 'EMMA WILSON', checkIn: '2026-06-27', checkOut: '2026-07-06', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.556', roomNote: '' },
    { roomNo: '701', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'LUCA VERDI', checkIn: '2026-06-24', checkOut: '2026-07-02', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.559', roomNote: '' },
    { roomNo: '708', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'JOACHIM SCHMITT', checkIn: '2026-06-27', checkOut: '2026-07-01', adults: 3, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.562', roomNote: '' },
    { roomNo: '802', roomType: 'DBL', agency: 'EXPEDIA', vip: '', bpt: '', guestName: 'CRISTOFORO D AMATO', checkIn: '2026-06-25', checkOut: '2026-07-03', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.565', roomNote: '' },
    { roomNo: '810', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'VALERIA SAITTA', checkIn: '2026-06-26', checkOut: '2026-07-04', adults: 2, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.568', roomNote: '' },
    { roomNo: '815', roomType: 'DBL', agency: 'BOOKING-', vip: '', bpt: '', guestName: 'ESCALADA NAPOLETANA SRL', checkIn: '2026-06-27', checkOut: '2026-06-30', adults: 3, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.571', roomNote: '' },
    { roomNo: '819', roomType: 'DSU', agency: 'ATRIP-GTI', vip: '', bpt: '', guestName: 'JOACHIM SCHMITT', checkIn: '2026-06-27', checkOut: '2026-07-01', adults: 3, child1: 0, baby: 0, board: 'BB', hsekli: 'SOLD', confirmationNo: '174.574', roomNote: '' },
  ];
  return base.map((s) => ({ ...s, child2: 0 }));
}

function columnHeaderDailyGuests(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Vip', 4) +
      pad('Bpt', 4) +
      pad('Misafirler', 30) +
      pad('C/In', 7) +
      pad('C/Out', 7) +
      pad('Ytak', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('Toplam', 7, 'right') +
      pad('Bbk', 4, 'right') +
      pad('Pan', 4) +
      pad('Hşekli', 7) +
      pad('KNo', 10) +
      'Oda Notu',
    '-'.repeat(130),
  ].join('\n');
}

function reservationToDailyGuestRow(r: Reservation): DailyGuestRow {
  const adults = r.adults ?? 1;
  const child1 = r.children ?? 0;
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    vip: (r.extraData?.vip ?? '').slice(0, 4),
    bpt: (r.extraData?.bpt ?? r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    adults,
    child1,
    child2: 0,
    baby: Number(r.extraData?.baby ?? 0),
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    hsekli: (r.extraData?.hsekli ?? r.extraData?.bookingType ?? 'SOLD').slice(0, 7).toUpperCase(),
    confirmationNo: (r.extraData?.confirmationNo ?? r.refNo ?? '').slice(0, 10),
    roomNote: (r.notes ?? r.extraData?.roomNote ?? '').slice(0, 12).toUpperCase(),
  };
}

function renderDailyGuestRow(row: DailyGuestRow): string {
  const total = row.adults + row.child1 + row.child2;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad(row.vip, 4) +
    pad(row.bpt, 4) +
    pad(row.guestName, 30) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(total), 7, 'right') +
    pad(String(row.baby), 4, 'right') +
    pad(row.board, 4) +
    pad(row.hsekli, 7) +
    pad(row.confirmationNo, 10) +
    row.roomNote
  );
}

type EarlyDepartureRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  vip: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  checkOutTime?: string;
  originalCheckOut: string;
  penaltyTotal: number;
  personCount: number;
  recordNo: string;
  checkoutNote: string;
};

function getEarlyDepartures(reservations: Reservation[], businessDate: string): Reservation[] {
  return reservations.filter((r) => {
    if (r.checkOut !== businessDate) return false;
    const original = r.extraData?.originalCheckOut ?? r.extraData?.eskiCOut;
    if (original && original > r.checkOut) return true;
    return r.extraData?.earlyCheckout === 'true' || r.extraData?.erkenCikis === 'true';
  });
}

function columnHeaderEarlyDepartures(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Vip', 4) +
      pad('Rpt', 4) +
      pad('I.Misafir', 26) +
      pad('C/In', 7) +
      pad('C/Out Saati', 12) +
      pad('EskiCOut', 9) +
      pad('Toplam Pen', 11, 'right') +
      pad('Kişi', 5, 'right') +
      pad('KNo', 8) +
      'Cout Notu',
    '-'.repeat(118),
  ].join('\n');
}

function reservationToEarlyDepartureRow(r: Reservation): EarlyDepartureRow {
  const adults = r.adults ?? 1;
  const children = r.children ?? 0;
  const original = r.extraData?.originalCheckOut ?? r.extraData?.eskiCOut ?? r.checkOut;
  const penalty = Number(r.extraData?.penaltyTotal ?? r.extraData?.toplamPen ?? 0);
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 5).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    vip: (r.extraData?.vip ?? '').slice(0, 4),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    checkOutTime: r.extraData?.departureTime ?? '12:00',
    originalCheckOut: original,
    penaltyTotal: penalty,
    personCount: adults + children,
    recordNo: (r.extraData?.recordNo ?? r.refNo ?? r.id).slice(0, 8),
    checkoutNote: (r.extraData?.checkoutNote ?? r.extraData?.coutNotu ?? r.notes ?? '').slice(0, 20).toUpperCase(),
  };
}

function renderEarlyDepartureRow(row: EarlyDepartureRow): string {
  const checkOutSaati = `${fmtShortDate(row.checkOut)} ${fmtTime(row.checkOutTime)}`;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad(row.vip, 4) +
    pad(row.rpt, 4) +
    pad(row.guestName, 26) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(checkOutSaati, 12) +
    pad(fmtShortDate(row.originalCheckOut), 9) +
    pad(fmtMoney(row.penaltyTotal), 11, 'right') +
    pad(String(row.personCount), 5, 'right') +
    pad(row.recordNo, 8) +
    row.checkoutNote
  );
}

function renderGr103(ctx: LegacyRenderContext): string {
  const rows = getEarlyDepartures(ctx.reservations, ctx.businessDate).map(reservationToEarlyDepartureRow);
  const totalPenalty = rows.reduce((s, r) => s + r.penaltyTotal, 0);
  const totalPersons = rows.reduce((s, r) => s + r.personCount, 0);
  const lines = [
    ...reportHeader(ctx, 'Günlük Erken Çıkış Listesi'),
    columnHeaderEarlyDepartures(),
    ...rows.map(renderEarlyDepartureRow),
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 64) +
      pad(fmtMoney(totalPenalty), 11, 'right') +
      pad(String(totalPersons), 5, 'right'),
  ];
  return lines.join('\n');
}

type TodayReservationRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  vip: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  child1: number;
  child2: number;
  roomCount: number;
  board: string;
  bookingType: string;
  confirmationNo: string;
  note: string;
};

function getReservationsEnteredToday(reservations: Reservation[], businessDate: string): Reservation[] {
  return reservations.filter((r) => r.createdAt.slice(0, 10) === businessDate);
}

function buildDemoTodayReservations(): TodayReservationRow[] {
  const specs: Omit<TodayReservationRow, 'child2'>[] = [
    { roomNo: '210', roomType: 'DBL', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'NURDAN TORUNN', checkIn: '2026-07-02', checkOut: '2026-07-09', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.381', note: 'B.O NRF REZ' },
    { roomNo: '411', roomType: 'DBL', agency: 'W.INT', vip: '', rpt: '', guestName: 'STEFANO SAMMARCO', checkIn: '2026-07-01', checkOut: '2026-07-08', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.402', note: 'STANDART' },
    { roomNo: '108', roomType: 'TRP', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'MARCO BIANCHI', checkIn: '2026-06-28', checkOut: '2026-07-05', adults: 2, child1: 1, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.415', note: '' },
    { roomNo: '305', roomType: 'DBL', agency: 'EXPEDIA', vip: '', rpt: '', guestName: 'ELENA ROSSI', checkIn: '2026-07-03', checkOut: '2026-07-10', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.420', note: '' },
    { roomNo: '512', roomType: 'SNG', agency: 'DIRECT', vip: '', rpt: '', guestName: 'AHMET YILMAZ', checkIn: '2026-06-29', checkOut: '2026-07-02', adults: 1, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.428', note: '' },
    { roomNo: '620', roomType: 'DBL', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'JOHN SMITH', checkIn: '2026-07-04', checkOut: '2026-07-11', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.431', note: '' },
    { roomNo: '718', roomType: 'DBL', agency: 'AGODA', vip: '', rpt: '', guestName: 'MARIA GARCIA', checkIn: '2026-07-05', checkOut: '2026-07-12', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.439', note: '' },
    { roomNo: '402', roomType: 'TWN', agency: 'W.INT', vip: '', rpt: '', guestName: 'KLAUS WEBER', checkIn: '2026-06-30', checkOut: '2026-07-06', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.441', note: '' },
    { roomNo: '215', roomType: 'DBL', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'SOPHIE MARTIN', checkIn: '2026-07-06', checkOut: '2026-07-13', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.448', note: '' },
    { roomNo: '319', roomType: 'DBL', agency: 'TUI', vip: '', rpt: '', guestName: 'PIERRE DUBOIS', checkIn: '2026-07-07', checkOut: '2026-07-14', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.452', note: '' },
    { roomNo: '501', roomType: 'TRP', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'FAMILY GROUP A', checkIn: '2026-07-08', checkOut: '2026-07-15', adults: 2, child1: 2, roomCount: 2, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.460', note: 'GRUP' },
    { roomNo: '607', roomType: 'DBL', agency: 'EXPEDIA', vip: '', rpt: '', guestName: 'ANNA KOWALSKI', checkIn: '2026-07-09', checkOut: '2026-07-16', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.465', note: '' },
    { roomNo: '704', roomType: 'DBL', agency: 'DIRECT', vip: '', rpt: '', guestName: 'HANS MUELLER', checkIn: '2026-07-10', checkOut: '2026-07-17', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.471', note: '' },
    { roomNo: '812', roomType: 'SNG', agency: 'W.INT', vip: '', rpt: '', guestName: 'LUCA VERDI', checkIn: '2026-07-11', checkOut: '2026-07-18', adults: 1, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.478', note: '' },
    { roomNo: '903', roomType: 'DBL', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'EMMA WILSON', checkIn: '2026-07-12', checkOut: '2026-07-19', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.482', note: '' },
    { roomNo: '110', roomType: 'DBL', agency: 'AGODA', vip: '', rpt: '', guestName: 'DAVID BROWN', checkIn: '2026-07-13', checkOut: '2026-07-20', adults: 2, child1: 0, roomCount: 1, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.489', note: '' },
    { roomNo: '225', roomType: 'TRP', agency: 'BOOKING.COM', vip: '', rpt: '', guestName: 'FAMILY GROUP B', checkIn: '2026-07-14', checkOut: '2026-07-21', adults: 3, child1: 1, roomCount: 2, board: 'BB', bookingType: 'SOLD', confirmationNo: '174.495', note: 'GRUP' },
  ];
  return specs.map((s) => ({ ...s, child2: 0 }));
}

function columnHeaderTodayReservations(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Vip', 4) +
      pad('Rpt', 4) +
      pad('I.Misafir', 26) +
      pad('C/In', 7) +
      pad('C/Out', 7) +
      pad('Ytşk', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('Toplam', 7, 'right') +
      pad('Oda', 4, 'right') +
      pad('Pan', 4) +
      pad('KŞekli', 7) +
      pad('KNo', 10) +
      'Not',
    '-'.repeat(118),
  ].join('\n');
}

function reservationToTodayReservationRow(r: Reservation): TodayReservationRow {
  const adults = r.adults ?? 1;
  const child1 = r.children ?? 0;
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    vip: (r.extraData?.vip ?? '').slice(0, 4),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    adults,
    child1,
    child2: 0,
    roomCount: Number(r.extraData?.roomCount ?? 1),
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    bookingType: (r.extraData?.bookingType ?? r.extraData?.folioType ?? 'SOLD').slice(0, 7).toUpperCase(),
    confirmationNo: (r.extraData?.confirmationNo ?? r.refNo ?? '').slice(0, 10),
    note: (r.notes ?? '').slice(0, 14).toUpperCase(),
  };
}

function renderTodayReservationRow(row: TodayReservationRow): string {
  const total = row.adults + row.child1 + row.child2;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad(row.vip, 4) +
    pad(row.rpt, 4) +
    pad(row.guestName, 26) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(total), 7, 'right') +
    pad(String(row.roomCount), 4, 'right') +
    pad(row.board, 4) +
    pad(row.bookingType, 7) +
    pad(row.confirmationNo, 10) +
    row.note
  );
}

function renderGr104(ctx: LegacyRenderContext): string {
  const entered = getReservationsEnteredToday(ctx.reservations, ctx.businessDate);
  const rows = entered.length > 0 ? entered.map(reservationToTodayReservationRow) : buildDemoTodayReservations();
  const totalAdults = rows.reduce((s, r) => s + r.adults, 0);
  const totalChild1 = rows.reduce((s, r) => s + r.child1, 0);
  const totalChild2 = rows.reduce((s, r) => s + r.child2, 0);
  const totalPax = rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0);
  const totalRooms = rows.reduce((s, r) => s + r.roomCount, 0);
  const lines = [
    ...reportHeader(ctx, 'Bugün Girilen Rezervasyon Listesi'),
    columnHeaderTodayReservations(),
    ...rows.map(renderTodayReservationRow),
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 38) +
      pad(String(totalAdults), 5, 'right') +
      pad(String(totalChild1), 5, 'right') +
      pad(String(totalChild2), 5, 'right') +
      pad(String(totalPax), 7, 'right') +
      pad(String(totalRooms), 4, 'right'),
  ];
  return lines.join('\n');
}

type TodayCancelledRow = {
  roomNo: string;
  roomType: string;
  agency: string;
  vip: string;
  rpt: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  child1: number;
  child2: number;
  baby: number;
  board: string;
  reservationType: string;
  confirmationNo: string;
  note: string;
};

function getCancelledToday(reservations: Reservation[], businessDate: string): Reservation[] {
  return reservations.filter((r) => {
    if (r.status !== 'CANCELLED') return false;
    const cancelDate = r.extraData?.cancelledAt ?? r.extraData?.cancelDate ?? r.createdAt;
    return cancelDate.slice(0, 10) === businessDate;
  });
}

function columnHeaderTodayCancelled(): string {
  return [
    pad('Oda', 4) +
      pad('Tipi', 5) +
      pad('Acenta', 12) +
      pad('Vip', 4) +
      pad('Rpt', 4) +
      pad('1.Misafir', 26) +
      pad('C/In', 7) +
      pad('C/Out', 7) +
      pad('Ytşk', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('Toplam', 7, 'right') +
      pad('Bbk', 4, 'right') +
      pad('Pan', 4) +
      pad('RŞekli', 7) +
      pad('KNo', 10) +
      'Not',
    '-'.repeat(118),
  ].join('\n');
}

function reservationToTodayCancelledRow(r: Reservation): TodayCancelledRow {
  const adults = r.adults ?? 1;
  const child1 = r.children ?? 0;
  return {
    roomNo: r.roomNo ?? '—',
    roomType: (r.roomType ?? 'STD').slice(0, 4).toUpperCase(),
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    vip: (r.extraData?.vip ?? '').slice(0, 4),
    rpt: (r.extraData?.rpt ?? '').slice(0, 4),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    adults,
    child1,
    child2: 0,
    baby: Number(r.extraData?.baby ?? 0),
    board: (r.mealPlan ?? 'BB').slice(0, 3).toUpperCase(),
    reservationType: (r.extraData?.reservationType ?? r.extraData?.bookingType ?? 'SOLD').slice(0, 7).toUpperCase(),
    confirmationNo: (r.extraData?.confirmationNo ?? r.refNo ?? '').slice(0, 10),
    note: (r.notes ?? r.extraData?.cancelNote ?? '').slice(0, 14).toUpperCase(),
  };
}

function renderTodayCancelledRow(row: TodayCancelledRow): string {
  const total = row.adults + row.child1 + row.child2;
  return (
    pad(row.roomNo, 4) +
    pad(row.roomType, 5) +
    pad(row.agency, 12) +
    pad(row.vip, 4) +
    pad(row.rpt, 4) +
    pad(row.guestName, 26) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(String(total), 7, 'right') +
    pad(String(row.baby), 4, 'right') +
    pad(row.board, 4) +
    pad(row.reservationType, 7) +
    pad(row.confirmationNo, 10) +
    row.note
  );
}

function renderGr105(ctx: LegacyRenderContext): string {
  const rows = getCancelledToday(ctx.reservations, ctx.businessDate).map(reservationToTodayCancelledRow);
  const totalAdults = rows.reduce((s, r) => s + r.adults, 0);
  const totalChild1 = rows.reduce((s, r) => s + r.child1, 0);
  const totalChild2 = rows.reduce((s, r) => s + r.child2, 0);
  const totalPax = rows.reduce((s, r) => s + r.adults + r.child1 + r.child2, 0);
  const totalBaby = rows.reduce((s, r) => s + r.baby, 0);
  const lines = [
    ...reportHeader(ctx, 'Bugün İptal Edilen Rezervasyonlar Listesi'),
    columnHeaderTodayCancelled(),
    ...rows.map(renderTodayCancelledRow),
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 38) +
      pad(String(totalAdults), 5, 'right') +
      pad(String(totalChild1), 5, 'right') +
      pad(String(totalChild2), 5, 'right') +
      pad(String(totalPax), 7, 'right') +
      pad(String(totalBaby), 4, 'right'),
  ];
  return lines.join('\n');
}

type RoomPriceRow = {
  roomNo: string;
  agency: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  adults: number;
  child1: number;
  child2: number;
  priceDescription: string;
  currency: string;
  exchangeRate: string;
  price: number;
};

const DEMO_ROOM_PRICE_ROWS: RoomPriceRow[] = [
  { roomNo: '101', agency: 'BOOKING.COM', guestName: 'MARCO ROSSI', checkIn: '2026-06-22', checkOut: '2026-06-29', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '7*61.94EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10450 },
  { roomNo: '208', agency: 'BOOKING.COM', guestName: 'ABDULLA ALAMERI', checkIn: '2026-06-27', checkOut: '2026-07-05', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '8*61.94EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10200 },
  { roomNo: '213', agency: 'W.INT', guestName: 'STEFANO SAMMARCO', checkIn: '2026-06-24', checkOut: '2026-07-01', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '7*58.50EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10800 },
  { roomNo: '305', agency: 'BOOKING.COM', guestName: 'NURDAN TORUNN', checkIn: '2026-06-26', checkOut: '2026-07-03', roomType: 'SNG', adults: 1, child1: 0, child2: 0, priceDescription: '7*52.00EURO', currency: 'EURO', exchangeRate: '38,2500', price: 9800 },
  { roomNo: '312', agency: 'EXPEDIA', guestName: 'ELENA PETROVA', checkIn: '2026-06-23', checkOut: '2026-06-30', roomType: 'DBL', adults: 2, child1: 1, child2: 0, priceDescription: '7*64.20EURO', currency: 'EURO', exchangeRate: '38,2500', price: 11000 },
  { roomNo: '402', agency: 'W.INT', guestName: 'KLAUS WEBER', checkIn: '2026-06-25', checkOut: '2026-07-02', roomType: 'TRP', adults: 2, child1: 1, child2: 0, priceDescription: '7*72.10EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10500 },
  { roomNo: '510', agency: 'BOOKING.COM', guestName: 'CRISTOFORO D AMATO', checkIn: '2026-06-24', checkOut: '2026-07-01', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '7*61.94EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10300 },
  { roomNo: '607', agency: 'AGODA', guestName: 'ANNA KOWALSKI', checkIn: '2026-06-27', checkOut: '2026-07-04', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '7*55.80EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10650 },
  { roomNo: '704', agency: 'DIRECT', guestName: 'AHMET YILMAZ', checkIn: '2026-06-26', checkOut: '2026-07-01', roomType: 'DBL', adults: 2, child1: 0, child2: 0, priceDescription: '5*4200TL', currency: 'TL', exchangeRate: '1,0000', price: 10400 },
  { roomNo: '815', agency: 'BOOKING.COM', guestName: 'JOACHIM SCHMITT', checkIn: '2026-06-27', checkOut: '2026-07-03', roomType: 'DSU', adults: 3, child1: 0, child2: 0, priceDescription: '6*78.40EURO', currency: 'EURO', exchangeRate: '38,2500', price: 10265.3 },
];

function columnHeaderRoomPrice(): string {
  return [
    pad('OdaNo', 6) +
      pad('Acenta', 12) +
      pad('Misafir', 24) +
      pad('Geliş', 7) +
      pad('Ayrılış', 8) +
      pad('OdaTip', 7) +
      pad('Ytşk', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('Fiyat Açıklama', 16) +
      pad('Döviz', 6) +
      pad('Kur', 9) +
      pad('Fiyat', 12, 'right'),
    '-'.repeat(118),
  ].join('\n');
}

function nightsBetweenStay(checkIn: string, checkOut: string): number {
  return nightsBetween(checkIn, checkOut);
}

function reservationToRoomPriceRow(r: Reservation): RoomPriceRow {
  const adults = r.adults ?? 1;
  const children = r.children ?? 0;
  const nights = nightsBetweenStay(r.checkIn, r.checkOut);
  const currency = (r.currency ?? 'EUR').toString().toUpperCase();
  const rate = r.rate;
  const price = rate * nights;
  const priceDesc = (r.extraData?.priceDescription ?? `${nights}*${rate}${currency === 'TRY' || currency === 'TL' ? 'TL' : 'EURO'}`).slice(0, 16);
  return {
    roomNo: r.roomNo ?? '—',
    agency: (r.agency ?? 'DIRECT').slice(0, 12).toUpperCase(),
    guestName: r.guestName.toUpperCase(),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomType: (r.roomType ?? 'STD').slice(0, 6).toUpperCase(),
    adults,
    child1: children > 0 ? children : 0,
    child2: 0,
    priceDescription: priceDesc,
    currency: currency === 'TRY' ? 'TL' : currency.slice(0, 6),
    exchangeRate: (r.extraData?.exchangeRate ?? (currency === 'TL' || currency === 'TRY' ? '1,0000' : '38,2500')).slice(0, 9),
    price,
  };
}

function renderRoomPriceRow(row: RoomPriceRow): string {
  return (
    pad(row.roomNo, 6) +
    pad(row.agency, 12) +
    pad(row.guestName, 24) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 8) +
    pad(row.roomType, 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(row.priceDescription, 16) +
    pad(row.currency, 6) +
    pad(row.exchangeRate, 9) +
    pad(fmtMoney(row.price), 12, 'right')
  );
}

function renderRoomPriceReport(ctx: LegacyRenderContext, title: string, grouped: boolean): string {
  const inhouse = getInHouseGuests(ctx.reservations);
  const rows = inhouse.length > 0 ? inhouse.map(reservationToRoomPriceRow) : DEMO_ROOM_PRICE_ROWS;
  const totalPrice = rows.reduce((s, r) => s + r.price, 0);
  const lines: string[] = [
    ...reportHeaderRoomPrice(ctx, title),
    columnHeaderRoomPrice(),
  ];

  if (grouped) {
    const byAgency = new Map<string, RoomPriceRow[]>();
    for (const row of rows) {
      const list = byAgency.get(row.agency) ?? [];
      list.push(row);
      byAgency.set(row.agency, list);
    }
    for (const [agency, group] of byAgency) {
      lines.push(pad(agency, 118));
      lines.push(...group.map(renderRoomPriceRow));
      const sub = group.reduce((s, r) => s + r.price, 0);
      lines.push(pad('', 94) + pad(fmtMoney(sub), 12, 'right'));
      lines.push('');
    }
  } else {
    lines.push(...rows.map(renderRoomPriceRow));
  }

  lines.push(
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) + pad('', 70) + pad(fmtMoney(totalPrice), 12, 'right'),
  );
  return lines.join('\n');
}

function renderGr205(ctx: LegacyRenderContext): string {
  return renderRoomPriceReport(ctx, 'ODA FİYAT KONTROL LİSTESİ', false);
}

function renderGr205G(ctx: LegacyRenderContext): string {
  return renderRoomPriceReport(ctx, 'GRUPLU ODA FİYAT KONTROL', true);
}

/** GRODAFIYATKON — gruplu oda fiyat kontrol (Elektra arşiv) */
export function renderGroupedRoomPriceReport(ctx: LegacyRenderContext): string {
  return renderRoomPriceReport(ctx, 'ODA FİYAT KONTROL LİSTESİ', true);
}

type ManualRoomPriceRow = RoomPriceRow & { folio: number };

function getManualRoomPrices(reservations: Reservation[]): Reservation[] {
  return getInHouseGuests(reservations).filter((r) => {
    if (r.extraData?.manualPrice === 'true' || r.extraData?.manuelFiyat === 'true') return true;
    return r.extraData?.manualRate != null || r.extraData?.manuelOdaFiyat != null;
  });
}

function buildDemoManualRoomPrices(): ManualRoomPriceRow[] {
  const guests = [
    'ABDULLA ALAMERI', 'MARCO ROSSI', 'STEFANO SAMMARCO', 'NURDAN TORUNN', 'ELENA PETROVA',
    'KLAUS WEBER', 'CRISTOFORO D AMATO', 'ANNA KOWALSKI', 'AHMET YILMAZ', 'JOACHIM SCHMITT',
    'MARIA GARCIA', 'PIERRE DUBOIS', 'SOPHIE MARTIN', 'HANS MUELLER', 'EMMA WILSON',
    'DAVID BROWN', 'LUCA VERDI', 'VALERIA SAITTA', 'JOHN SMITH', 'FAMILY GROUP A',
    'FAMILY GROUP B', 'ESCALADA NAPOLETANA',
  ];
  const agencies = ['BOOKING-NRF', 'BOOKING.COM', 'BOOKING-NRF', 'BOOKING.COM', 'BOOKING-NRF'];
  const prices = [4750, 4680, 4820, 4590, 4710, 4650, 4780, 4620, 4700, 4740, 4765, 4610, 4695, 4735, 4675, 4805, 4640, 4725, 4770, 4580, 4810, 5515.34];
  return guests.map((guestName, i) => {
    const price = prices[i] ?? 4700;
    const folio = price;
    const roomNo = String(101 + i * 3);
    const agency = agencies[i % agencies.length]!;
    return {
      roomNo,
      agency,
      guestName,
      checkIn: '2026-06-22',
      checkOut: '2026-06-29',
      roomType: i % 5 === 0 ? 'SNG' : 'DBL',
      adults: 2,
      child1: i % 7 === 0 ? 1 : 0,
      child2: 0,
      priceDescription: `7*${(price / 7 / 38.25).toFixed(2)}EURO`.slice(0, 16),
      currency: 'EURO',
      exchangeRate: '38,2500',
      price,
      folio,
    };
  });
}

function columnHeaderManualRoomPrice(): string {
  return [
    pad('OdaNo', 6) +
      pad('Acenta', 12) +
      pad('Misafir', 22) +
      pad('Geliş', 7) +
      pad('Ayrılış', 8) +
      pad('OdaTip', 7) +
      pad('Ytş', 5, 'right') +
      pad('Çck1', 5, 'right') +
      pad('Çck2', 5, 'right') +
      pad('F.Açıklama', 14) +
      pad('Döviz Kuru', 12) +
      pad('Fiyat', 11, 'right') +
      pad('Folyo', 11, 'right'),
    '-'.repeat(118),
  ].join('\n');
}

function reservationToManualRoomPriceRow(r: Reservation): ManualRoomPriceRow {
  const base = reservationToRoomPriceRow(r);
  const folio = Number(r.extraData?.folioAmount ?? r.extraData?.folioBalance ?? base.price);
  return { ...base, folio };
}

function renderManualRoomPriceRow(row: ManualRoomPriceRow): string {
  const fx = `${row.currency} ${row.exchangeRate}`.slice(0, 12);
  return (
    pad(row.roomNo, 6) +
    pad(row.agency, 12) +
    pad(row.guestName, 22) +
    pad(fmtShortDate(row.checkIn), 7) +
    pad(fmtShortDate(row.checkOut), 8) +
    pad(row.roomType, 7) +
    pad(String(row.adults), 5, 'right') +
    pad(String(row.child1), 5, 'right') +
    pad(String(row.child2), 5, 'right') +
    pad(row.priceDescription, 14) +
    pad(fx, 12) +
    pad(fmtMoney(row.price), 11, 'right') +
    pad(fmtMoney(row.folio), 11, 'right')
  );
}

function renderGr206(ctx: LegacyRenderContext): string {
  const manual = getManualRoomPrices(ctx.reservations);
  const rows = manual.length > 0 ? manual.map(reservationToManualRoomPriceRow) : buildDemoManualRoomPrices();
  const totalPrice = rows.reduce((s, r) => s + r.price, 0);
  const totalFolio = rows.reduce((s, r) => s + r.folio, 0);
  const lines = [
    ...reportHeaderRoomPrice(ctx, 'ODA FİYAT KONTROL LİSTESİ (Sadece Manuel)'),
    columnHeaderManualRoomPrice(),
    ...rows.map(renderManualRoomPriceRow),
    '',
    '-'.repeat(118),
    pad(`Listelenen ${rows.length}`, 24) +
      pad('', 59) +
      pad(fmtMoney(totalPrice), 11, 'right') +
      pad(fmtMoney(totalFolio), 11, 'right'),
  ];
  return lines.join('\n');
}

function renderGeneric(report: EodLegacyReportDef, ctx: LegacyRenderContext): string {
  return renderReportAsTable(report, ctx);
}

export type LegacyRenderOptions = {
  /** Sihirbazda kaydedilmiş sütun düzeni */
  columnOverride?: string[];
};

export function renderLegacyEodReport(
  report: EodLegacyReportDef,
  ctx: LegacyRenderContext,
  options?: LegacyRenderOptions,
): string {
  if (options?.columnOverride?.length) {
    return renderReportAsTable(report, ctx, options.columnOverride);
  }

  const batch = renderBatchEodReport(report, ctx);
  if (batch) return batch;

  switch (report.id) {
    case 'GR101':
      return renderGr101(ctx);
    case 'GR102':
      return renderGr102(ctx);
    case 'GR1021':
      return renderGr1021(ctx);
    case 'GR103':
      return renderGr103(ctx);
    case 'GR104':
      return renderGr104(ctx);
    case 'GR105':
      return renderGr105(ctx);
    case 'GR201':
      return renderGr201(ctx);
    case 'GR202':
      return renderGr202(ctx);
    case 'GR205':
      return renderGr205(ctx);
    case 'GR205G':
      return renderGr205G(ctx);
    case 'GR206':
      return renderGr206(ctx);
    case 'GRODAFIYATKON':
      return renderGroupedRoomPriceReport(ctx);
    default:
      return renderGeneric(report, ctx);
  }
}

export function defaultBusinessDate(): string {
  return TODAY;
}
