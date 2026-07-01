import {
  enrichInHouse,
  getInHouseGuests,
  getTodayArrivals,
  getTodayDepartures,
  getVacantRooms,
} from '@/lib/data/reception';
import type { FolioLine, InHouseGuest } from '@/lib/data/reception-queries';
import type { AuditEntry } from '@/lib/server/audit-log';
import type { Reservation } from '@/lib/types/reservation';
import type { CashEntry, FxExchange } from '@/lib/data/cash';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import { HK_STATUS_LABELS } from '@/lib/types/room';
import { pickPlannedRoomChanges } from '@/lib/reception/room-changes';
import { reservationExtra } from '@/lib/reservations/list-tabs';
import { reservationToEgmSeed } from '@/lib/egm/merge';
import { EGM_ID_TYPE_LABELS, type EgmIdentityRecord } from '@/lib/egm/types';
import type { EodFinanceSnapshot, EodInvoiceRow } from './eod-finance-types';
import { fmtFullDate, fmtMoney, fmtShortDate, type LegacyRenderContext } from './eod-legacy-render-utils';

function balances(ctx: LegacyRenderContext): Record<string, number> {
  return ctx.folioBalances ?? {};
}

export function liveInHouse(ctx: LegacyRenderContext): InHouseGuest[] {
  const linesMap = ctx.folioLinesByReservation;
  if (linesMap && Object.keys(linesMap).length > 0) {
    const bal = balances(ctx);
    return ctx.reservations
      .filter((r) => r.status === 'CHECKED_IN')
      .map((r) => enrichInHouse(r, linesMap[r.id], bal[r.id]));
  }
  return getInHouseGuests(ctx.reservations, balances(ctx));
}

export function liveVipGuests(ctx: LegacyRenderContext): InHouseGuest[] {
  return liveInHouse(ctx).filter((r) => Boolean(r.extraData?.vip?.trim()));
}

export type FolioExtreRow = {
  folio: string;
  room: string;
  guest: string;
  type: string;
  desc: string;
  amount: number;
  balance: number;
  user: string;
};

export function buildLiveFolioExtreRows(ctx: LegacyRenderContext): FolioExtreRow[] {
  const rows: FolioExtreRow[] = [];
  const user = ctx.userName.toUpperCase();

  for (const g of liveInHouse(ctx)) {
    const folioNo = `F-${String(g.roomNo ?? g.id).replace(/\D/g, '').slice(0, 4) || g.id.slice(-4)}01`;
    let running = 0;
    for (const line of g.folioLines) {
      const signed = line.type === 'payment' ? -line.amount : line.amount;
      running += signed;
      rows.push({
        folio: folioNo,
        room: g.roomNo ?? '—',
        guest: g.guestName.toUpperCase(),
        type: line.type === 'payment' ? 'TAHSİLAT' : line.description.toUpperCase().includes('PANSİYON') ? 'FB' : 'ODA',
        desc: line.description.toUpperCase().slice(0, 16),
        amount: signed,
        balance: running,
        user,
      });
    }
  }
  return rows;
}

export type DailyTxRow = {
  folio: string;
  room: string;
  guest: string;
  type: string;
  desc: string;
  amount: number;
  user: string;
};

export function buildLiveDailyTxRows(ctx: LegacyRenderContext): DailyTxRow[] {
  return buildLiveFolioExtreRows(ctx).map((r) => ({
    folio: r.folio,
    room: r.room,
    guest: r.guest,
    type: r.type,
    desc: r.desc,
    amount: r.amount,
    user: r.user,
  }));
}

export type GuestPriceRow = {
  no: number;
  room: string;
  agency: string;
  guest: string;
  pax: number;
  in: string;
  out: string;
  price: number;
  fno: string;
};

export function buildLiveGuestPriceRows(ctx: LegacyRenderContext): GuestPriceRow[] {
  return liveInHouse(ctx).map((g, i) => ({
    no: i + 1,
    room: g.roomNo ?? '—',
    agency: (g.agency ?? 'DIRECT').slice(0, 14).toUpperCase(),
    guest: g.guestName.toUpperCase(),
    pax: (g.adults ?? 1) + (g.children ?? 0),
    in: fmtShortDate(g.checkIn),
    out: fmtShortDate(g.checkOut),
    price: g.rate,
    fno: '',
  }));
}

export type CustomerRow = {
  guest: string;
  agency: string;
  room: string;
  in: string;
  out: string;
};

export function buildLiveCustomerRows(ctx: LegacyRenderContext): CustomerRow[] {
  return liveInHouse(ctx).map((g) => ({
    guest: g.guestName.toUpperCase(),
    agency: (g.agency ?? 'DIRECT').slice(0, 14).toUpperCase(),
    room: g.roomNo ?? '—',
    in: fmtFullDate(g.checkIn),
    out: fmtFullDate(g.checkOut),
  }));
}

export type HkRow = {
  room: string;
  type: string;
  status: string;
  guest: string;
  out: string;
  note: string;
};

const HK_STATUS_TR: Record<string, string> = {
  CLEAN: 'TEMİZ',
  DIRTY: 'KİRLİ',
  INSPECT: 'KONTROL',
  INSPECTED: 'KONTROL',
  OOO: 'OOO',
  DND: 'DND',
  OOS: 'OOI',
};

function hkRooms(ctx: LegacyRenderContext): Record<string, HkRoomRecord> {
  return { ...DEFAULT_HK_ROOMS, ...ctx.hkRooms };
}

function hkStatusLabel(status: string): string {
  return (
    HK_STATUS_TR[status] ??
    HK_STATUS_LABELS[status as keyof typeof HK_STATUS_LABELS]?.toUpperCase() ??
    status
  );
}

export function buildLiveHkRows(ctx: LegacyRenderContext): HkRow[] {
  const map = hkRooms(ctx);
  const rows: HkRow[] = [];
  for (const g of liveInHouse(ctx)) {
    const room = g.roomNo ?? '—';
    const hk = room !== '—' ? map[room] : undefined;
    rows.push({
      room,
      type: (g.roomType ?? 'STD').slice(0, 4).toUpperCase(),
      status: hk ? hkStatusLabel(hk.hkStatus) : 'DOLU',
      guest: g.guestName.toUpperCase(),
      out: fmtFullDate(g.checkOut),
      note: (hk?.notes ?? g.notes ?? '').slice(0, 12).toUpperCase(),
    });
  }
  for (const v of getVacantRooms(ctx.reservations)) {
    const hk = map[v.roomNo];
    rows.push({
      room: v.roomNo,
      type: v.type.slice(0, 4).toUpperCase(),
      status: hk ? hkStatusLabel(hk.hkStatus) : HK_STATUS_TR[v.status] ?? v.status,
      guest: '—',
      out: '—',
      note: (hk?.notes ?? '').slice(0, 12).toUpperCase(),
    });
  }
  return rows.sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }));
}

export type MgmtSummary = {
  occupancyPct: string;
  revenue: number;
  adr: number;
  revpar: number;
  soldRooms: number;
  vacantRooms: number;
  arrivals: number;
  departures: number;
  inHouse: number;
};

export function buildLiveMgmtSummary(ctx: LegacyRenderContext): MgmtSummary | null {
  const inHouse = liveInHouse(ctx);
  if (inHouse.length === 0 && ctx.reservations.length === 0) return null;

  const vacant = getVacantRooms(ctx.reservations);
  const totalRooms = Math.max(1, inHouse.length + vacant.length);
  const occupancy = (inHouse.length / totalRooms) * 100;
  const revenue = inHouse.reduce((s, r) => s + r.rate, 0);
  const adr = inHouse.length ? revenue / inHouse.length : 0;
  const revpar = revenue / totalRooms;
  const arrivals = getTodayArrivals(ctx.reservations, ctx.businessDate).length;
  const departures = getTodayDepartures(ctx.reservations, ctx.businessDate, balances(ctx)).length;

  return {
    occupancyPct: `%${occupancy.toFixed(1).replace('.', ',')}`,
    revenue,
    adr,
    revpar,
    soldRooms: inHouse.length,
    vacantRooms: vacant.length,
    arrivals,
    departures,
    inHouse: inHouse.length,
  };
}

export function reservationHasFolioData(reservations: Reservation[]): boolean {
  return reservations.some((r) => r.status === 'CHECKED_IN');
}

function finance(ctx: LegacyRenderContext): EodFinanceSnapshot | undefined {
  return ctx.finance;
}

function cashEntries(ctx: LegacyRenderContext): CashEntry[] {
  return finance(ctx)?.cashEntries ?? [];
}

function invoicesOnDate(ctx: LegacyRenderContext): EodInvoiceRow[] {
  const date = ctx.businessDate;
  return (finance(ctx)?.invoices ?? []).filter((inv) => inv.date === date);
}

function fxOnDate(ctx: LegacyRenderContext): FxExchange[] {
  return finance(ctx)?.fxExchanges ?? [];
}

function roomFromCashDescription(description: string): string {
  const m = description.match(/Oda\s+(\d+)/i);
  return m?.[1] ?? '—';
}

export type LiveCashRow = {
  desc: string;
  amount: number;
  cur: string;
  debit: number;
  credit: number;
  user: string;
  time: string;
};

export function buildLiveCashRows(ctx: LegacyRenderContext): LiveCashRow[] {
  return cashEntries(ctx).map((e) => ({
    desc: e.description,
    amount: e.amount,
    cur: e.currency,
    debit: e.type === 'odeme' || e.type === 'doviz' ? e.amount : 0,
    credit: e.type === 'tahsilat' || e.type === 'depozit' || e.type === 'avans' ? e.amount : 0,
    user: e.user,
    time: e.time,
  }));
}

export type LiveKasaLedgerRow = {
  currency: string;
  room: string;
  guest: string;
  time: string;
  desc: string;
  amount: number;
  user: string;
};

export function buildLiveKasaLedgerRows(ctx: LegacyRenderContext): LiveKasaLedgerRow[] {
  return cashEntries(ctx).map((e) => ({
    currency: e.currency,
    room: roomFromCashDescription(e.description),
    guest: e.description.split('—').pop()?.trim().slice(0, 22) ?? e.description.slice(0, 22),
    time: e.time,
    desc: e.type.toUpperCase().slice(0, 12),
    amount: e.amount,
    user: e.user,
  }));
}

export type LiveFxRow = {
  room: string;
  rowNo: number;
  date: string;
  received: string;
  receivedAmt: number;
  given: string;
  givenAmt: number;
  user: string;
  docNo: string;
  tlAmount: number;
};

export function buildLiveFxRows(ctx: LegacyRenderContext): LiveFxRow[] {
  return fxOnDate(ctx).map((fx, i) => ({
    room: fx.roomNo,
    rowNo: i + 1,
    date: fmtFullDate(ctx.businessDate),
    received: fx.fromCurrency,
    receivedAmt: fx.fromAmount,
    given: 'TL',
    givenAmt: fx.tryAmount,
    user: fx.user,
    docNo: `FX-${fx.id.slice(-4)}`,
    tlAmount: fx.tryAmount,
  }));
}

export type LiveInvoiceRow = {
  inv: string;
  guest: string;
  amount: number;
  account: string;
  status: string;
};

export function buildLiveDailyInvoiceRows(ctx: LegacyRenderContext): LiveInvoiceRow[] {
  return invoicesOnDate(ctx).map((inv) => ({
    inv: inv.no,
    guest: inv.guest.toUpperCase(),
    amount: inv.amount,
    account: inv.companyName ? 'CITY LEDGER' : 'CASH',
    status: inv.status === 'paid' ? 'KESİLDİ' : inv.status.toUpperCase(),
  }));
}

export function buildLiveCityLedgerInvoices(ctx: LegacyRenderContext): LiveInvoiceRow[] {
  return invoicesOnDate(ctx)
    .filter((inv) => Boolean(inv.companyName?.trim()))
    .map((inv) => ({
      inv: inv.no,
      guest: (inv.companyName ?? inv.guest).toUpperCase(),
      amount: inv.amount,
      account: 'CITY LEDGER',
      status: inv.status === 'paid' ? 'KAPALI' : 'AÇIK',
    }));
}

export type FolioBalanceRow = {
  room: string;
  agency: string;
  guest: string;
  in: string;
  out: string;
  balance: number;
};

export function buildLiveFolioBalanceRows(ctx: LegacyRenderContext): FolioBalanceRow[] {
  return liveInHouse(ctx).map((g) => ({
    room: g.roomNo ?? '—',
    agency: (g.agency ?? 'DIRECT').slice(0, 14).toUpperCase(),
    guest: g.guestName.toUpperCase(),
    in: fmtFullDate(g.checkIn),
    out: fmtFullDate(g.checkOut),
    balance: -Math.abs(g.folioBalance),
  }));
}

export function buildLiveCashTotalsByCurrency(ctx: LegacyRenderContext): Array<{ currency: string; total: number }> {
  const map = new Map<string, number>();
  for (const e of cashEntries(ctx)) {
    map.set(e.currency, (map.get(e.currency) ?? 0) + e.amount);
  }
  return [...map.entries()].map(([currency, total]) => ({ currency, total }));
}

const CASH_KIND: Record<string, string> = {
  tahsilat: 'TAHSİLAT',
  odeme: 'ÖDEME',
  doviz: 'DÖVİZ',
  depozit: 'DEPOZİT',
  avans: 'AVANS',
};

const CURRENCY_GROUP: Record<string, string> = {
  TRY: 'Grup 90 (TL)',
  EUR: 'Grup 94 (EURO)',
  USD: 'Grup 95 (USD)',
};

function cashDeptCode(currency: string): string {
  if (currency === 'EUR') return '94';
  if (currency === 'USD') return '95';
  return '90';
}

export type NetKasaRow = {
  date: string;
  time: string;
  dept: string;
  name: string;
  authorized: string;
  room: string;
  entryNo: string;
  note: string;
  kind: string;
  fxCode: string;
  amount: number;
  tlAmount: number;
  rate: number;
  currencyGroup: string;
};

export function buildLiveNetKasaRows(ctx: LegacyRenderContext): NetKasaRow[] {
  const date = fmtFullDate(ctx.businessDate);
  return cashEntries(ctx).map((e) => ({
    date,
    time: e.time,
    dept: cashDeptCode(e.currency),
    name: 'CASH',
    authorized: e.user.toUpperCase().slice(0, 10),
    room: roomFromCashDescription(e.description),
    entryNo: `E-${e.id.slice(-4)}`,
    note: /oda/i.test(e.description) ? 'ODA' : e.description.slice(0, 16).toUpperCase(),
    kind: CASH_KIND[e.type] ?? e.type.toUpperCase(),
    fxCode: e.currency === 'TRY' ? 'TL' : e.currency,
    amount: e.amount,
    tlAmount: e.amount,
    rate: 1,
    currencyGroup: CURRENCY_GROUP[e.currency] ?? `Grup ${cashDeptCode(e.currency)}`,
  }));
}

export type InvoiceControlRow = {
  dept: string;
  amount: number;
  foreignAmount: number;
  fxCode: string;
  invNo: string;
  note: string;
  paymentMethod: string;
  guestName: string;
  currencyGroup: string;
};

export function buildLiveInvoiceControlRows(ctx: LegacyRenderContext): InvoiceControlRow[] {
  return invoicesOnDate(ctx).map((inv) => ({
    dept: '90',
    amount: inv.amount,
    foreignAmount: inv.amount,
    fxCode: 'TL',
    invNo: inv.no,
    note: inv.status === 'paid' ? '' : 'AÇIK',
    paymentMethod: inv.companyName ? 'CITY LEDGER' : 'CASH',
    guestName: inv.guest.toUpperCase(),
    currencyGroup: 'Grup 90 (TL)',
  }));
}

function classifyFolioDept(description: string): string {
  const u = description.toUpperCase();
  if (u.includes('MINIBAR') || u.includes('OTOMAT')) return '11 OTOMAT';
  if (u.includes('PANSİYON') || u.includes('PANSIYON') || u.includes('REST')) return '20 RESTAURANT';
  return '01 ROOM';
}

export type DeptRevenueRow = {
  dept: string;
  revenue: number;
  debit: number;
  credit: number;
};

function addDeptAmount(
  map: Map<string, { debit: number; credit: number }>,
  dept: string,
  debit: number,
  credit: number,
) {
  const cur = map.get(dept) ?? { debit: 0, credit: 0 };
  map.set(dept, { debit: cur.debit + debit, credit: cur.credit + credit });
}

export function buildLiveDeptRevenueRows(ctx: LegacyRenderContext): DeptRevenueRow[] {
  const map = new Map<string, { debit: number; credit: number }>();

  for (const g of liveInHouse(ctx)) {
    for (const line of g.folioLines) {
      if (line.type === 'charge') {
        addDeptAmount(map, classifyFolioDept(line.description), 0, line.amount);
      } else {
        addDeptAmount(map, '90 CASH', line.amount, 0);
      }
    }
  }

  for (const e of cashEntries(ctx)) {
    if (e.type === 'tahsilat' || e.type === 'depozit' || e.type === 'avans') {
      addDeptAmount(map, '90 CASH', e.amount, 0);
    } else if (e.type === 'odeme') {
      addDeptAmount(map, '90 CASH', 0, e.amount);
    }
    if (e.currency === 'EUR' && e.type === 'tahsilat') {
      addDeptAmount(map, '94 EURO KASA', 0, e.amount);
    }
    if (e.currency === 'USD' && e.type === 'tahsilat') {
      addDeptAmount(map, '95 USD KASA', 0, e.amount);
    }
  }

  for (const inv of invoicesOnDate(ctx)) {
    if (inv.companyName?.trim()) {
      addDeptAmount(map, '92 C.LEDGER', inv.amount, 0);
    }
  }

  return [...map.entries()]
    .map(([dept, v]) => ({
      dept,
      revenue: v.credit - v.debit,
      debit: v.debit,
      credit: v.credit,
    }))
    .sort((a, b) => a.dept.localeCompare(b.dept));
}

export type BilancoRow = {
  dept: string;
  debit: number;
  credit: number;
  balance: number;
};

export function buildLiveBilancoRows(ctx: LegacyRenderContext): BilancoRow[] {
  const deptRows = buildLiveDeptRevenueRows(ctx);
  if (deptRows.length === 0) return [];

  const rows = deptRows.map((r) => ({
    dept: r.dept,
    debit: r.debit,
    credit: r.credit,
    balance: r.credit - r.debit,
  }));
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  rows.push({
    dept: '99 GENEL TOPLAM',
    debit: totalDebit,
    credit: totalCredit,
    balance: totalCredit - totalDebit,
  });
  return rows;
}

export function hasFinanceData(ctx: LegacyRenderContext): boolean {
  const f = finance(ctx);
  if (!f) return false;
  return f.cashEntries.length > 0 || f.invoices.length > 0 || f.fxExchanges.length > 0;
}

export type CreditInvoiceRow = {
  invNo: string;
  agency: string;
  room: string;
  checkIn: string;
  checkOut: string;
  voucher: string;
  guest: string;
  invoiceAmount: number;
  folioAmount: number;
};

export function buildLiveCreditInvoiceRows(ctx: LegacyRenderContext): CreditInvoiceRow[] {
  const credit = (finance(ctx)?.invoices ?? []).filter(
    (inv) => inv.date === ctx.businessDate && Boolean(inv.companyName?.trim()),
  );
  if (credit.length === 0) return [];

  const byGuest = new Map(liveInHouse(ctx).map((g) => [g.guestName.toUpperCase(), g]));
  return credit.map((inv) => {
    const guest = byGuest.get(inv.guest.toUpperCase());
    return {
      invNo: inv.no,
      agency: (guest?.agency ?? '—').slice(0, 12).toUpperCase(),
      room: guest?.roomNo ?? '—',
      checkIn: guest ? fmtFullDate(guest.checkIn) : fmtFullDate(ctx.businessDate),
      checkOut: guest ? fmtFullDate(guest.checkOut) : fmtFullDate(ctx.businessDate),
      voucher: (guest?.extraData?.voucherNo ?? '').slice(0, 8),
      guest: inv.guest.toUpperCase(),
      invoiceAmount: inv.amount,
      folioAmount: guest ? Math.abs(guest.folioBalance) : inv.amount,
    };
  });
}

export type InvoiceTotalRow = {
  type: string;
  count: number;
  amount: number;
};

export function buildLiveInvoiceTotals(ctx: LegacyRenderContext): InvoiceTotalRow[] {
  const daily = invoicesOnDate(ctx);
  if (daily.length === 0) return [];

  const issued = daily.filter((inv) => inv.status === 'paid' || inv.status === 'issued');
  const credit = daily.filter((inv) => Boolean(inv.companyName?.trim()));
  const unpaid = daily.filter((inv) => inv.status === 'draft' && !inv.companyName?.trim());
  const sum = (rows: EodInvoiceRow[]) => rows.reduce((s, r) => s + r.amount, 0);

  const issuedAmt = sum(issued);
  const creditAmt = sum(credit);
  const unpaidAmt = sum(unpaid);
  const totalCount = issued.length + credit.length + unpaid.length;

  return [
    { type: 'KESİLEN FATURA', count: issued.length, amount: issuedAmt },
    { type: 'KREDİYE KALDIRILAN', count: credit.length, amount: creditAmt },
    { type: 'FATURALI KESİLMEYEN', count: unpaid.length, amount: unpaidAmt },
    { type: 'TOPLAM', count: totalCount, amount: issuedAmt + creditAmt + unpaidAmt },
  ];
}

export function buildLiveUnbilledInvoiceRows(ctx: LegacyRenderContext): LiveInvoiceRow[] {
  return invoicesOnDate(ctx)
    .filter((inv) => inv.status === 'draft' && !inv.companyName?.trim())
    .map((inv) => ({
      inv: inv.no,
      guest: inv.guest.toUpperCase(),
      amount: inv.amount,
      account: 'AÇIK',
      status: 'KESİLMEDİ',
    }));
}

export type CumulativeDeptRow = {
  dept: string;
  amount: number;
};

/** İş günü departman gelirleri — kümülatif için aynı gün özeti (tarih aralığı API yok) */
export function buildLiveCumulativeDeptRows(ctx: LegacyRenderContext): CumulativeDeptRow[] {
  return buildLiveDeptRevenueRows(ctx)
    .filter((r) => r.dept !== '99 GENEL TOPLAM')
    .map((r) => ({ dept: r.dept, amount: r.revenue }));
}

export type RoomChangeRow = {
  guest: string;
  from: string;
  to: string;
  time: string;
  user: string;
  note: string;
};

export function buildLiveRoomChangeRows(ctx: LegacyRenderContext): RoomChangeRow[] {
  const rows: RoomChangeRow[] = [];

  for (const change of pickPlannedRoomChanges(ctx.reservations)) {
    if (change.changeDate !== ctx.businessDate) continue;
    rows.push({
      guest: change.guestName.toUpperCase(),
      from: change.fromRoom,
      to: change.toRoom,
      time: reservationExtra(change.reservation, 'roomChangeTime') || '—',
      user: (reservationExtra(change.reservation, 'createdBy') || ctx.userName).toUpperCase().slice(0, 10),
      note: (change.notes || '').toUpperCase().slice(0, 20),
    });
  }

  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

export type DepartureRoomRow = {
  label: string;
  count: number;
};

export function buildLiveDepartureRoomRows(ctx: LegacyRenderContext): DepartureRoomRow[] {
  return getTodayDepartures(ctx.reservations, ctx.businessDate, balances(ctx))
    .filter((g) => g.roomNo)
    .map((g) => ({
      label: `Ayrıl ${g.roomNo}`,
      count: 1,
    }));
}

export type DiscountRefundRow = {
  guest: string;
  folio: string;
  amount: number;
  desc: string;
  user: string;
};

export function buildLiveDiscountRefundRows(ctx: LegacyRenderContext): DiscountRefundRow[] {
  const user = ctx.userName.toUpperCase();
  const rows: DiscountRefundRow[] = [];

  for (const g of liveInHouse(ctx)) {
    const folioNo = `F-${String(g.roomNo ?? g.id).replace(/\D/g, '').slice(0, 4) || g.id.slice(-4)}01`;
    for (const line of g.folioLines) {
      const isDiscount =
        line.type === 'charge' &&
        (line.amount < 0 || /indirim|iade|discount|refund/i.test(line.description));
      if (isDiscount) {
        rows.push({
          guest: g.guestName.toUpperCase(),
          folio: folioNo,
          amount: line.amount,
          desc: line.description.toUpperCase().slice(0, 20),
          user,
        });
      }
    }
  }

  return rows;
}

const OFFICIAL_GUEST_RE = /RESMİ|KURUM|GOV|CORP|T\.C\.|BELEDİYE|BAKANL|KAMU|THY/i;

export type OfficialGuestRow = {
  guest: string;
  room: string;
  in: string;
  out: string;
  agency: string;
  status: string;
};

export function buildLiveOfficialGuestRows(ctx: LegacyRenderContext): OfficialGuestRow[] {
  const seen = new Set<string>();
  const rows: OfficialGuestRow[] = [];

  for (const inv of finance(ctx)?.invoices ?? []) {
    const company = inv.companyName?.trim();
    if (!company) continue;
    const key = `inv:${company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      guest: company.toUpperCase(),
      room: '—',
      in: fmtShortDate(inv.date),
      out: fmtShortDate(inv.date),
      agency: 'RESMİ',
      status: inv.status === 'paid' || inv.status === 'issued' ? 'AKTİF' : 'KAPALI',
    });
  }

  for (const g of liveInHouse(ctx)) {
    const agency = (g.agency ?? '').toUpperCase();
    const market = (g.market ?? '').toUpperCase();
    const isOfficial =
      OFFICIAL_GUEST_RE.test(agency) ||
      OFFICIAL_GUEST_RE.test(market) ||
      g.extraData?.corporate === '1' ||
      g.extraData?.official === '1';
    if (!isOfficial) continue;
    const key = `g:${g.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      guest: g.guestName.toUpperCase(),
      room: g.roomNo ?? '—',
      in: fmtShortDate(g.checkIn),
      out: fmtShortDate(g.checkOut),
      agency: agency.slice(0, 12) || 'KURUMSAL',
      status: 'AKTİF',
    });
  }

  return rows;
}

export type MainCurrentRow = {
  room: string;
  name: string;
  opening: number;
  roomRev: number;
  fbRev: number;
  otherRev: number;
  total: number;
  collected: number;
  credit: number;
  discount: number;
  closing: number;
};

function classifyFolioCharge(description: string): 'room' | 'fb' | 'other' {
  const d = description.toUpperCase();
  if (/PANSİYON|REST|FB|BAR|KAHVALTI|YEMEK|İÇECEK|MINIBAR/.test(d)) return 'fb';
  if (/KONAKLAMA|ROOM|ODA/.test(d)) return 'room';
  return 'other';
}

export function buildLiveMainCurrentRows(ctx: LegacyRenderContext): MainCurrentRow[] {
  const rows: MainCurrentRow[] = [];

  for (const g of liveInHouse(ctx)) {
    if (Math.abs(g.folioBalance) < 0.01 && g.folioLines.length === 0) continue;

    let roomRev = 0;
    let fbRev = 0;
    let otherRev = 0;
    let collected = 0;
    let discount = 0;

    for (const line of g.folioLines) {
      if (line.type === 'payment') {
        collected += line.amount;
        continue;
      }
      if (line.amount < 0 || /indirim|iade/i.test(line.description)) {
        discount += Math.abs(line.amount);
        continue;
      }
      const kind = classifyFolioCharge(line.description);
      if (kind === 'room') roomRev += line.amount;
      else if (kind === 'fb') fbRev += line.amount;
      else otherRev += line.amount;
    }

    const total = roomRev + fbRev + otherRev;
    const closing = -g.folioBalance;
    const opening = closing - total + collected;

    rows.push({
      room: g.roomNo ?? '—',
      name: g.guestName.toUpperCase(),
      opening,
      roomRev,
      fbRev,
      otherRev,
      total,
      collected,
      credit: 0,
      discount,
      closing,
    });
  }

  return rows;
}

export type StockReportRow = {
  product: string;
  dept: string;
  qty: number;
  amount: number;
};

export function buildLiveStockRows(ctx: LegacyRenderContext): StockReportRow[] {
  return (finance(ctx)?.stockItems ?? [])
    .filter((item) => item.qty > 0)
    .map((item) => ({
      product: item.name.toUpperCase(),
      dept: item.category.toUpperCase().slice(0, 14),
      qty: item.qty,
      amount: item.qty * item.unitCost,
    }));
}

export type MasterFolioRow = {
  room: string;
  voucher: string;
  agency: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  accountNo: string;
  masterFolioNo: string;
};

export type MasterFolioGroup = {
  groupKey: string;
  rows: MasterFolioRow[];
};

export function buildLiveMasterFolioGroups(ctx: LegacyRenderContext): MasterFolioGroup[] {
  const groups = new Map<string, InHouseGuest[]>();

  for (const g of liveInHouse(ctx)) {
    const key = g.extraData?.masterFolioNo?.trim() || g.extraData?.voucherNo?.trim() || g.refNo;
    const list = groups.get(key) ?? [];
    list.push(g);
    groups.set(key, list);
  }

  const out: MasterFolioGroup[] = [];
  for (const [groupKey, guests] of groups) {
    const hasExplicitMaster = guests.some((g) => g.extraData?.masterFolioNo?.trim());
    if (guests.length < 2 && !hasExplicitMaster) continue;

    const masterFolioNo = guests.find((g) => g.extraData?.masterFolioNo)?.extraData?.masterFolioNo ?? groupKey;
    const rows = guests.map((g) => ({
      room: g.roomNo ?? '—',
      voucher: g.extraData?.voucherNo ?? groupKey,
      agency: (g.agency ?? 'DIRECT').slice(0, 14).toUpperCase(),
      guest: g.guestName.toUpperCase(),
      checkIn: fmtShortDate(g.checkIn),
      checkOut: fmtShortDate(g.checkOut),
      accountNo: `H-${String(g.roomNo ?? g.id).replace(/\D/g, '').slice(0, 4) || g.id.slice(-4)}01`,
      masterFolioNo,
    }));
    out.push({ groupKey: masterFolioNo, rows });
  }

  return out;
}

function policeIdTypeLabel(idType?: string): string {
  if (idType === 'TCKN') return 'NÜFUS CÜZDANI';
  if (idType === 'PASSPORT') return 'PASAPORT';
  if (idType && idType in EGM_ID_TYPE_LABELS) {
    return EGM_ID_TYPE_LABELS[idType as keyof typeof EGM_ID_TYPE_LABELS].toUpperCase();
  }
  return (idType ?? 'DİĞER').toUpperCase();
}

function policeBirthDisplay(iso: string): string {
  if (!iso) return '';
  if (iso.includes('.')) return iso;
  return fmtFullDate(iso);
}

export type PoliceRow = {
  room: string;
  id: string;
  first: string;
  last: string;
  birthPlace: string;
  birth: string;
  father: string;
  mother: string;
  idType: string;
  serial: string;
  nat: string;
};

export function buildLivePoliceRows(ctx: LegacyRenderContext): PoliceRow[] {
  const egmByRes = new Map<string, EgmIdentityRecord>();
  const egmByRef = new Map<string, EgmIdentityRecord>();
  for (const record of ctx.egmRecords ?? []) {
    if (record.reservationId) egmByRes.set(record.reservationId, record);
    if (record.refNo) egmByRef.set(record.refNo, record);
  }

  const rows: PoliceRow[] = [];
  for (const g of liveInHouse(ctx)) {
    const egm = egmByRes.get(g.id) ?? egmByRef.get(g.refNo);
    const seed = reservationToEgmSeed(g);
    const first = (egm?.firstName ?? seed.firstName ?? '').toUpperCase();
    const last = (egm?.lastName ?? seed.lastName ?? '').toUpperCase();
    const idNo = (egm?.idNo ?? seed.idNo ?? '').toUpperCase();
    rows.push({
      room: g.roomNo ?? '—',
      id: idNo,
      first,
      last,
      birthPlace: (egm?.birthPlace ?? seed.birthPlace ?? '').toUpperCase(),
      birth: policeBirthDisplay(egm?.birthDate ?? seed.birthDate ?? ''),
      father: (egm?.fatherName ?? seed.fatherName ?? '').toUpperCase(),
      mother: (egm?.motherName ?? seed.motherName ?? '').toUpperCase(),
      idType: policeIdTypeLabel(egm?.idType ?? seed.idType),
      serial: (g.extraData?.idSerial ?? idNo).toUpperCase(),
      nat: (egm?.nationality ?? seed.nationality ?? '').toUpperCase(),
    });
  }

  return rows.sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }));
}

function revGroupForDescription(description: string): string {
  const u = description.toUpperCase();
  if (u.includes('MINIBAR') || u.includes('OTOMAT') || u.includes('İÇECEK')) return 'İÇECEK';
  if (u.includes('PANSİYON') || u.includes('PANSIYON') || u.includes('REST')) return 'FB';
  return 'ODA';
}

function deptParts(dept: string): { deptNo: string; deptName: string } {
  const [deptNo = '01', ...rest] = dept.split(' ');
  return { deptNo, deptName: rest.join(' ') || 'ROOM' };
}

export type DeptTxRow = {
  deptNo: string;
  deptName: string;
  revGroup: string;
  agency: string;
  room: string;
  pax: string;
  folio: string;
  time: string;
  doc: string;
  user: string;
  total: number;
};

export function buildLiveDeptTxRows(ctx: LegacyRenderContext): DeptTxRow[] {
  const rows: DeptTxRow[] = [];
  const user = ctx.userName.toUpperCase();
  let docSeq = 32340;

  for (const g of liveInHouse(ctx)) {
    const folioNo = `F-${String(g.roomNo ?? g.id).replace(/\D/g, '').slice(0, 4) || g.id.slice(-4)}01`;
    const agency = (g.agency ?? '').slice(0, 12).toUpperCase();
    const pax = String((g.adults ?? 1) + (g.children ?? 0));
    const dayLines = g.folioLines.filter((line) => line.date === ctx.businessDate);
    const lines = dayLines.length > 0 ? dayLines : g.folioLines;

    for (const line of lines) {
      const signed = line.type === 'payment' ? -line.amount : line.amount;
      const dept = line.type === 'payment' ? '90 CASH' : classifyFolioDept(line.description);
      const { deptNo, deptName } = deptParts(dept);
      rows.push({
        deptNo,
        deptName,
        revGroup: line.type === 'payment' ? 'ODA' : revGroupForDescription(line.description),
        agency: line.type === 'payment' ? '' : agency,
        room: g.roomNo ?? '—',
        pax: line.type === 'payment' ? '1' : pax,
        folio: folioNo,
        time: '00:04',
        doc: `OF-${docSeq++}`,
        user,
        total: signed,
      });
    }
  }

  for (const e of cashEntries(ctx)) {
    rows.push({
      deptNo: '90',
      deptName: 'CASH',
      revGroup: 'ODA',
      agency: '',
      room: roomFromCashDescription(e.description),
      pax: '1',
      folio: `F-${roomFromCashDescription(e.description).replace(/\D/g, '').slice(0, 4) || '0000'}01`,
      time: e.time,
      doc: `OF-${docSeq++}`,
      user: e.user.toUpperCase().slice(0, 10),
      total: e.type === 'tahsilat' || e.type === 'depozit' || e.type === 'avans' ? -e.amount : e.amount,
    });
  }

  return rows;
}

function reservationForAudit(ctx: LegacyRenderContext, entityId?: string) {
  if (!entityId) return undefined;
  return ctx.reservations.find((r) => r.id === entityId || r.refNo === entityId);
}

function folioNoForGuest(g: { roomNo?: string; id: string }): string {
  return `F-${String(g.roomNo ?? g.id).replace(/\D/g, '').slice(0, 4) || g.id.slice(-4)}01`;
}

function parseAuditAmount(detail?: string): number {
  const m = detail?.match(/·\s*([\d.,]+)\s*$/);
  if (!m?.[1]) return 0;
  return Number(m[1].replace(/\./g, '').replace(',', '.')) || 0;
}

function auditHaystack(log: AuditEntry): string {
  return `${log.action} ${log.detail ?? ''}`.toLowerCase();
}

export type FolioAuditKind = 'cancelled' | 'deleted' | 'transfer' | 'correction';

function matchesFolioAuditKind(log: AuditEntry, kind: FolioAuditKind): boolean {
  const hay = auditHaystack(log);
  if (kind === 'cancelled') return /void|cancel|iptal/.test(hay);
  if (kind === 'deleted') return /delete|silinen|silindi/.test(hay);
  if (kind === 'transfer') {
    return log.module === 'folio'
      ? /transfer|aktar/.test(hay)
      : log.module === 'reception' && /oda|room|transfer|→/.test(hay);
  }
  return /correction|düzelt|duzelt|adjust/.test(hay);
}

export type FolioAuditRow = {
  folio: string;
  room: string;
  guest: string;
  type: string;
  desc: string;
  amount: number;
  balance: number;
  user: string;
};

export function buildLiveFolioAuditRows(ctx: LegacyRenderContext, kind: FolioAuditKind): FolioAuditRow[] {
  const rows: FolioAuditRow[] = [];
  for (const log of ctx.auditLogs ?? []) {
    if (!matchesFolioAuditKind(log, kind)) continue;
    const res = reservationForAudit(ctx, log.entityId);
    rows.push({
      folio: folioNoForGuest(res ?? { id: log.entityId ?? 'x', roomNo: undefined }),
      room: res?.roomNo ?? '—',
      guest: (res?.guestName ?? log.detail?.split('·')[0]?.trim() ?? '—').toUpperCase(),
      type: log.action.toUpperCase().slice(0, 10),
      desc: (log.detail ?? log.action).toUpperCase().slice(0, 16),
      amount: parseAuditAmount(log.detail),
      balance: 0,
      user: log.user.toUpperCase().slice(0, 10),
    });
  }
  return rows;
}

export type FolioTransferRow = {
  folio: string;
  fromRoom: string;
  toRoom: string;
  guest: string;
  amount: number;
  desc: string;
  user: string;
};

export function buildLiveFolioTransferRows(ctx: LegacyRenderContext): FolioTransferRow[] {
  const rows: FolioAuditRow[] = buildLiveFolioAuditRows(ctx, 'transfer');
  return rows.map((r) => {
    const arrow = r.desc.match(/(\d{3,4})\s*[→\->]\s*(\d{3,4})/);
    return {
      folio: r.folio,
      fromRoom: arrow?.[1] ?? r.room,
      toRoom: arrow?.[2] ?? '—',
      guest: r.guest,
      amount: r.amount,
      desc: r.desc,
      user: r.user,
    };
  });
}

export type FolioCorrectionRow = {
  dept: string;
  deptName: string;
  time: string;
  room: string;
  guest: string;
  folio: string;
  payer: string;
  total: number;
  user: string;
  note: string;
};

export function buildLiveFolioCorrectionRows(ctx: LegacyRenderContext): FolioCorrectionRow[] {
  return buildLiveFolioAuditRows(ctx, 'correction').map((r) => ({
    dept: '01',
    deptName: 'ROOM',
    time: '00:00',
    room: r.room,
    guest: r.guest,
    folio: r.folio,
    payer: 'MİSAFİR',
    total: r.amount,
    user: r.user,
    note: r.desc,
  }));
}

export function buildLiveEmailGuestRows(ctx: LegacyRenderContext): GuestPriceRow[] {
  return liveInHouse(ctx)
    .filter((g) => Boolean(g.email?.trim()))
    .map((g, i) => ({
      no: i + 1,
      room: g.roomNo ?? '—',
      agency: (g.agency ?? 'DIRECT').slice(0, 14).toUpperCase(),
      guest: g.guestName.toUpperCase(),
      pax: (g.adults ?? 1) + (g.children ?? 0),
      in: fmtShortDate(g.checkIn),
      out: fmtShortDate(g.checkOut),
      price: g.rate,
      fno: g.email?.toUpperCase().slice(0, 12) ?? '',
    }));
}

/** Finans snapshot gerektiren GR raporları */
export const EOD_FINANCE_REPORT_IDS = new Set([
  'GR302K',
  'GR350',
  'GR400',
  'GR400K',
  'GR401',
  'GR401K',
  'GR401N',
  'GR402',
  'GR500',
  'GR501',
  'GR501I',
  'GR502',
  'GR503',
  'GR600',
  'GR601',
  'GR602',
  'GR602F',
  'GR701',
  'GRKASAISLEM',
  'GRMAL',
  'MASTERFOLYOKONTORL',
]);

/** HK oda durumu snapshot gerektiren raporlar */
export const EOD_HK_REPORT_IDS = new Set(['GR220']);

/** EGM kimlik snapshot gerektiren raporlar */
export const EOD_EGM_REPORT_IDS = new Set(['GR222']);

/** Denetim izi snapshot gerektiren raporlar */
export const EOD_AUDIT_REPORT_IDS = new Set(['GR301I', 'GR301S', 'GR302', 'GR303']);
