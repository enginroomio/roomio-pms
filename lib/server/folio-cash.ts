import type { CashEntry, DepositRow, FxExchange, KasaCloseRow } from '@/lib/data/cash';
import type { FolioLine } from '@/lib/data/reception-queries';
import type { Reservation } from '@/lib/types/reservation';
import { buildFolioChargeAmounts } from '@/lib/folio/charge-amounts';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { earnOnCheckoutReservation } from '@/lib/loyalty/service';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getAllReservationsServer, getBusinessDate, init } from '@/lib/server/pms-store';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapFolio(row: {
  id: string;
  reservationId: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  window?: string;
  currency?: string;
  foreignAmount?: number | null;
  exchangeRate?: number | null;
}): FolioLine {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: row.amount,
    type: row.type as FolioLine['type'],
    window: (row.window ?? 'guest') as FolioLine['window'],
    currency: row.currency ?? 'TRY',
    foreignAmount: row.foreignAmount ?? undefined,
    exchangeRate: row.exchangeRate ?? undefined,
  };
}

export function folioBalance(lines: FolioLine[]): number {
  const charges = lines.filter((l) => l.type === 'charge').reduce((s, l) => s + l.amount, 0);
  const payments = lines.filter((l) => l.type === 'payment').reduce((s, l) => s + l.amount, 0);
  return charges - payments;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export function buildInitialFolioCharges(r: Reservation): (Omit<FolioLine, 'id'> & { window?: FolioLine['window'] })[] {
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const corpWindow = r.extraData?.payerType === 'Şirket' ? 'company' as const : 'guest' as const;
  const roomForeign = r.rate * Math.min(nights, 2);
  const roomCharge = buildFolioChargeAmounts(roomForeign, r);
  const lines: (Omit<FolioLine, 'id'> & { window?: FolioLine['window'] })[] = [
    {
      date: r.checkIn,
      description: `Konaklama ${r.roomType}`,
      type: 'charge',
      window: corpWindow,
      ...roomCharge,
    },
  ];
  if (r.mealPlan !== 'RO') {
    lines.push({
      date: r.checkIn,
      description: `Pansiyon ${r.mealPlan}`,
      amount: 450 * r.adults,
      type: 'charge',
      window: 'guest',
    });
  }
  return lines;
}

export async function getFolioLinesServer(
  reservationId: string,
  propertyId?: string,
  window?: FolioLine['window'],
): Promise<FolioLine[]> {
  await init();
  const rows = await prisma.folioLine.findMany({
    where: {
      propertyId: pid(propertyId),
      reservationId,
      ...(window ? { window } : {}),
    },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(mapFolio);
}

export async function getFolioBalancesServer(
  reservationIds: string[],
  propertyId?: string,
): Promise<Record<string, number>> {
  if (!reservationIds.length) return {};
  await init();
  const rows = await prisma.folioLine.findMany({
    where: { propertyId: pid(propertyId), reservationId: { in: reservationIds } },
  });
  const map: Record<string, FolioLine[]> = {};
  for (const row of rows) {
    const list = map[row.reservationId] ?? [];
    list.push(mapFolio(row));
    map[row.reservationId] = list;
  }
  const out: Record<string, number> = {};
  for (const id of reservationIds) {
    out[id] = folioBalance(map[id] ?? []);
  }
  return out;
}

export async function postFolioLinesServer(
  reservationId: string,
  lines: (Omit<FolioLine, 'id'> & { window?: FolioLine['window']; id?: string })[],
  propertyId?: string,
): Promise<FolioLine[]> {
  await init();
  const prop = pid(propertyId);
  const createdAt = nowIso();
  await prisma.folioLine.createMany({
    data: lines.map((line, i) => ({
      id: line.id ?? `fl-${reservationId}-${Date.now()}-${i}`,
      propertyId: prop,
      reservationId,
      date: line.date,
      description: line.description,
      amount: line.amount,
      type: line.type,
      window: line.window ?? 'guest',
      currency: line.currency ?? 'TRY',
      foreignAmount: line.foreignAmount ?? null,
      exchangeRate: line.exchangeRate ?? null,
      createdAt,
    })),
  });
  return getFolioLinesServer(reservationId, prop);
}

export async function postFolioPaymentServer(
  reservationId: string,
  amount: number,
  opts: { register?: string; user?: string; description?: string; propertyId?: string; window?: FolioLine['window'] } = {},
): Promise<{ lines: FolioLine[]; cashEntry: CashEntry }> {
  await init();
  const prop = pid(opts.propertyId);
  const businessDate = await getBusinessDate(prop);
  const time = nowTime();
  const register = opts.register ?? 'Ana Kasa';
  const user = opts.user ?? 'Resepsiyon';
  const description = opts.description ?? `Folyo tahsilat — ${reservationId}`;

  const paymentLine: Omit<FolioLine, 'id'> & { window?: FolioLine['window'] } = {
    date: businessDate,
    description,
    amount,
    type: 'payment',
    window: opts.window ?? 'guest',
  };

  const lines = await postFolioLinesServer(reservationId, [paymentLine], prop);

  const cashId = `ce-${Date.now()}`;
  await prisma.cashEntry.create({
    data: {
      id: cashId,
      propertyId: prop,
      businessDate,
      time,
      register,
      type: 'tahsilat',
      description,
      amount,
      currency: 'TRY',
      user,
      reservationId,
    },
  });

  const cashEntry: CashEntry = {
    id: cashId,
    time,
    register,
    type: 'tahsilat',
    description,
    amount,
    currency: 'TRY',
    user,
  };

  bustReadCaches(prop);
  await appendAuditLog({
    module: 'folio',
    action: 'payment',
    entityType: 'Reservation',
    entityId: reservationId,
    user,
    detail: `${description} · ${amount}`,
  }, prop);
  return { lines, cashEntry };
}

export async function postFolioChargeServer(
  reservationId: string,
  amount: number,
  description: string,
  propertyId?: string,
  window: FolioLine['window'] = 'guest',
): Promise<FolioLine[]> {
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const lines = await postFolioLinesServer(
    reservationId,
    [{ date: businessDate, description, amount, type: 'charge', window }],
    prop,
  );
  await appendAuditLog({
    module: 'folio',
    action: 'charge',
    entityType: 'Reservation',
    entityId: reservationId,
    user: 'Resepsiyon',
    detail: `${description} · ${amount} · ${window}`,
  }, prop);
  bustReadCaches(prop);
  return lines;
}

export async function ensureFolioForReservation(
  r: Reservation,
  propertyId?: string,
): Promise<FolioLine[]> {
  const existing = await getFolioLinesServer(r.id, propertyId);
  if (existing.length) return existing;
  if (r.status !== 'CHECKED_IN') return [];
  return postFolioLinesServer(r.id, buildInitialFolioCharges(r), propertyId);
}

export async function checkInReservationServer(
  reservationId: string,
  roomNo: string,
  propertyId?: string,
  user = 'Resepsiyon',
  extraChargeCodes: string[] = [],
): Promise<Reservation | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { extraData: true },
  });
  const extra = existing?.extraData
    ? JSON.parse(existing.extraData) as Record<string, string>
    : {};
  if (extraChargeCodes.length) {
    extra.extraChargeCodes = extraChargeCodes.join(',');
  }

  const row = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: 'CHECKED_IN',
      roomNo,
      ...(extraChargeCodes.length ? { extraData: JSON.stringify(extra) } : {}),
    },
  });
  const r = {
    id: row.id,
    refNo: row.refNo,
    guestName: row.guestName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    roomType: row.roomType,
    roomNo: row.roomNo ?? undefined,
    adults: row.adults,
    children: row.children,
    mealPlan: row.mealPlan as Reservation['mealPlan'],
    rate: row.rate,
    currency: row.currency as Reservation['currency'],
    agency: row.agency,
    market: row.market,
    status: row.status as Reservation['status'],
    createdAt: row.createdAt,
    notes: row.notes ?? undefined,
    extraData: row.extraData ? (JSON.parse(row.extraData) as Record<string, string>) : undefined,
  };
  await ensureFolioForReservation(r, prop);
  if (extraChargeCodes.length) {
    const { postExtraChargesToFolioServer } = await import('@/lib/server/extra-charge-folio');
    await postExtraChargesToFolioServer(reservationId, extraChargeCodes, r, prop, user);
  }
  await appendAuditLog({
    module: 'reception',
    action: 'check_in',
    entityType: 'Reservation',
    entityId: reservationId,
    user,
    detail: `${r.guestName} · Oda ${roomNo}`,
  }, prop);
  bustReadCaches(prop);
  return r;
}

export async function checkOutReservationServer(
  reservationId: string,
  propertyId?: string,
  user = 'Resepsiyon',
): Promise<Reservation | null> {
  await init();
  const row = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CHECKED_OUT' },
  });
  await appendAuditLog({
    module: 'reception',
    action: 'check_out',
    entityType: 'Reservation',
    entityId: reservationId,
    user,
    detail: `${row.guestName}${row.roomNo ? ` · Oda ${row.roomNo}` : ''}`,
  }, row.propertyId);
  bustReadCaches(row.propertyId);

  void earnOnCheckoutReservation({
    id: row.id,
    refNo: row.refNo,
    guestName: row.guestName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    rate: row.rate,
    agency: row.agency,
    propertyId: row.propertyId,
  }).catch(() => undefined);

  return {
    id: row.id,
    refNo: row.refNo,
    guestName: row.guestName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    roomType: row.roomType,
    roomNo: row.roomNo ?? undefined,
    adults: row.adults,
    children: row.children,
    mealPlan: row.mealPlan as Reservation['mealPlan'],
    rate: row.rate,
    currency: row.currency as Reservation['currency'],
    agency: row.agency,
    market: row.market,
    status: row.status as Reservation['status'],
    createdAt: row.createdAt,
    notes: row.notes ?? undefined,
  };
}

export async function getCashEntriesServer(propertyId?: string, businessDate?: string): Promise<CashEntry[]> {
  await init();
  const prop = pid(propertyId);
  const date = businessDate ?? (await getBusinessDate(prop));
  const rows = await prisma.cashEntry.findMany({
    where: { propertyId: prop, businessDate: date },
    orderBy: { time: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    time: r.time,
    register: r.register,
    type: r.type as CashEntry['type'],
    description: r.description,
    amount: r.amount,
    currency: r.currency as CashEntry['currency'],
    user: r.user,
  }));
}

export async function getCashRegistersServer(propertyId?: string, businessDate?: string): Promise<KasaCloseRow[]> {
  await init();
  const prop = pid(propertyId);
  const date = businessDate ?? (await getBusinessDate(prop));
  const rows = await prisma.cashRegister.findMany({
    where: { propertyId: prop, businessDate: date },
    orderBy: { name: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    register: r.name,
    openedAt: r.openedAt,
    closedAt: r.closedAt,
    openingBalance: r.openingBalance,
    closingBalance: r.closingBalance,
    variance: r.variance,
    status: r.status as KasaCloseRow['status'],
  }));
}

export function registerExpectedBalance(
  openingBalance: number,
  registerName: string,
  entries: CashEntry[],
): number {
  return entries
    .filter((e) => e.register === registerName)
    .reduce((sum, e) => (e.type === 'odeme' ? sum - e.amount : sum + e.amount), openingBalance);
}

export async function closeCashRegisterServer(
  registerId: string,
  countedBalance: number,
  user = 'Resepsiyon',
  propertyId?: string,
): Promise<KasaCloseRow> {
  await init();
  const prop = pid(propertyId);
  const reg = await prisma.cashRegister.findFirst({ where: { id: registerId, propertyId: prop } });
  if (!reg) throw new Error('Kasa bulunamadı');
  if (reg.status !== 'open') throw new Error('Kasa zaten kapalı');

  const entries = await getCashEntriesServer(prop, reg.businessDate);
  const expected = registerExpectedBalance(reg.openingBalance, reg.name, entries);
  const variance = Math.round((countedBalance - expected) * 100) / 100;
  const closedAt = `${reg.businessDate} ${nowTime()}`;

  const row = await prisma.cashRegister.update({
    where: { id: registerId },
    data: {
      closedAt,
      closingBalance: countedBalance,
      variance,
      status: 'closed',
    },
  });

  await appendAuditLog({
    module: 'cash',
    action: 'close_register',
    entityType: 'CashRegister',
    entityId: registerId,
    user,
    detail: `${row.name} · sayım ${countedBalance} · fark ${variance}`,
  }, prop);
  bustReadCaches(prop);

  return {
    id: row.id,
    register: row.name,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    openingBalance: row.openingBalance,
    closingBalance: row.closingBalance,
    variance: row.variance,
    status: row.status as KasaCloseRow['status'],
  };
}

export async function transferCashBetweenRegistersServer(
  fromRegister: string,
  toRegister: string,
  amount: number,
  user = 'Resepsiyon',
  propertyId?: string,
): Promise<{ outEntry: CashEntry; inEntry: CashEntry }> {
  await init();
  const prop = pid(propertyId);
  if (fromRegister === toRegister) throw new Error('Aynı kasaya devir yapılamaz');
  if (amount <= 0) throw new Error('Tutar pozitif olmalı');

  const businessDate = await getBusinessDate(prop);
  const time = nowTime();
  const outId = `ce-out-${Date.now()}`;
  const inId = `ce-in-${Date.now() + 1}`;
  const descOut = `Devir çıkış → ${toRegister}`;
  const descIn = `Devir giriş ← ${fromRegister}`;

  await prisma.cashEntry.createMany({
    data: [
      {
        id: outId,
        propertyId: prop,
        businessDate,
        time,
        register: fromRegister,
        type: 'odeme',
        description: descOut,
        amount,
        currency: 'TRY',
        user,
        reservationId: null,
      },
      {
        id: inId,
        propertyId: prop,
        businessDate,
        time,
        register: toRegister,
        type: 'avans',
        description: descIn,
        amount,
        currency: 'TRY',
        user,
        reservationId: null,
      },
    ],
  });

  bustReadCaches(prop);

  const outEntry: CashEntry = {
    id: outId,
    time,
    register: fromRegister,
    type: 'odeme',
    description: descOut,
    amount,
    currency: 'TRY',
    user,
  };
  const inEntry: CashEntry = {
    id: inId,
    time,
    register: toRegister,
    type: 'avans',
    description: descIn,
    amount,
    currency: 'TRY',
    user,
  };
  return { outEntry, inEntry };
}

export async function cashSummaryServer(propertyId?: string) {
  const entries = await getCashEntriesServer(propertyId);
  const registers = await getCashRegistersServer(propertyId);
  const tahsilat = entries.filter((e) => e.type === 'tahsilat').reduce((s, e) => s + e.amount, 0);
  const openRegisters = registers.filter((k) => k.status === 'open').length;
  return { tahsilat, openRegisters, entries: entries.length };
}

export async function seedFolioAndCashIfEmpty(propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const folioCount = await prisma.folioLine.count({ where: { propertyId: prop } });
  if (folioCount > 0) return false;

  const businessDate = await getBusinessDate(prop);
  const reservations = await getAllReservationsServer(prop);
  const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN');

  for (const r of inHouse) {
    await postFolioLinesServer(r.id, buildInitialFolioCharges(r), prop);
    if (r.id === '1') {
      await postFolioLinesServer(
        r.id,
        [
          { date: r.checkIn, description: 'Minibar', amount: 320, type: 'charge' },
          { date: r.checkIn, description: 'Nakit tahsilat', amount: 2000, type: 'payment' },
        ],
        prop,
      );
    }
  }

  const demoCash: Array<Omit<CashEntry, 'id'> & { businessDate: string }> = [
    { businessDate, time: '09:12', register: 'Ana Kasa', type: 'tahsilat', description: 'Oda 312 — konaklama tahsilatı', amount: 5200, currency: 'TRY', user: 'Arda Y.' },
    { businessDate, time: '10:45', register: 'Resepsiyon 1', type: 'tahsilat', description: 'Oda 204 — ekstra yatak', amount: 850, currency: 'TRY', user: 'Arda Y.' },
    { businessDate, time: '11:30', register: 'Ana Kasa', type: 'doviz', description: 'EUR bozdurma — Miller', amount: 18420, currency: 'TRY', user: 'Selin K.' },
    { businessDate, time: '14:05', register: 'Resepsiyon 2', type: 'depozit', description: 'Oda 118 — depozit alındı', amount: 2000, currency: 'TRY', user: 'Arda Y.' },
    { businessDate, time: '15:22', register: 'Ana Kasa', type: 'avans', description: 'Gece vardiyası devir', amount: 15000, currency: 'TRY', user: 'Murat S.' },
  ];

  await prisma.cashEntry.createMany({
    data: demoCash.map((e, i) => ({
      id: `ce-seed-${i}`,
      propertyId: prop,
      businessDate: e.businessDate,
      time: e.time,
      register: e.register,
      type: e.type,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      user: e.user,
      reservationId: null,
    })),
  });

  await prisma.cashRegister.createMany({
    data: [
      { id: 'kc-seed-1', propertyId: prop, name: 'Ana Kasa', businessDate, openedAt: `${businessDate} 07:00`, closedAt: null, openingBalance: 12500, closingBalance: null, variance: 0, status: 'open' },
      { id: 'kc-seed-2', propertyId: prop, name: 'Resepsiyon 1', businessDate, openedAt: `${businessDate} 07:00`, closedAt: `${businessDate} 23:45`, openingBalance: 3200, closingBalance: 8750, variance: 0, status: 'closed' },
      { id: 'kc-seed-3', propertyId: prop, name: 'Resepsiyon 2', businessDate, openedAt: `${businessDate} 07:00`, closedAt: `${businessDate} 23:50`, openingBalance: 2800, closingBalance: 4100, variance: -50, status: 'closed' },
    ],
  });

  return true;
}

/** Demo FX/deposit — still static until FX API */
export function demoFxExchanges(): FxExchange[] {
  return [
    { id: 'fx-1', time: '11:30', guest: 'James Miller', roomNo: '205', fromCurrency: 'EUR', fromAmount: 400, rate: 46.05, tryAmount: 18420, user: 'Selin K.' },
    { id: 'fx-2', time: '13:15', guest: 'Marco Rossi', roomNo: '118', fromCurrency: 'USD', fromAmount: 250, rate: 42.8, tryAmount: 10700, user: 'Arda Y.' },
  ];
}

export function demoDeposits(): DepositRow[] {
  return [
    { id: 'dp-1', guest: 'Marco Rossi', roomNo: '118', amount: 2000, method: 'kart', takenAt: '2026-06-18 14:05', status: 'held' },
    { id: 'dp-2', guest: 'Zeynep Ak', roomNo: '215', amount: 1500, method: 'nakit', takenAt: '2026-06-17 16:20', status: 'applied' },
    { id: 'dp-3', guest: 'John Miller', roomNo: '205', amount: 1000, method: 'kart', takenAt: '2026-06-16 11:00', status: 'refunded' },
  ];
}
