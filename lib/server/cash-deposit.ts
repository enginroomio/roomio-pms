import type { CashEntry, DepositRow, KasaCloseRow } from '@/lib/data/cash';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';
import {
  getCashEntriesServer,
  getCashRegistersServer,
  registerExpectedBalance,
} from '@/lib/server/folio-cash';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export type CashCloseReport = {
  businessDate: string;
  hotel: string;
  generatedAt: string;
  registers: Array<KasaCloseRow & { expectedBalance: number }>;
  entries: CashEntry[];
  summary: {
    totalTahsilat: number;
    totalOdeme: number;
    totalDepozit: number;
    totalDoviz: number;
    openRegisters: number;
    closedRegisters: number;
    totalVariance: number;
  };
};

export async function getCashCloseReportServer(propertyId?: string): Promise<CashCloseReport> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const hotel = (await getProperty(prop))?.name ?? 'Hotel';
  const [registers, entries] = await Promise.all([
    getCashRegistersServer(prop, businessDate),
    getCashEntriesServer(prop, businessDate),
  ]);

  const enriched = registers.map((r) => ({
    ...r,
    expectedBalance: registerExpectedBalance(r.openingBalance, r.register, entries),
  }));

  const totalTahsilat = entries.filter((e) => e.type === 'tahsilat').reduce((s, e) => s + e.amount, 0);
  const totalOdeme = entries.filter((e) => e.type === 'odeme').reduce((s, e) => s + e.amount, 0);
  const totalDepozit = entries.filter((e) => e.type === 'depozit').reduce((s, e) => s + e.amount, 0);
  const totalDoviz = entries.filter((e) => e.type === 'doviz').reduce((s, e) => s + e.amount, 0);

  return {
    businessDate,
    hotel,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    registers: enriched,
    entries,
    summary: {
      totalTahsilat,
      totalOdeme,
      totalDepozit,
      totalDoviz,
      openRegisters: registers.filter((r) => r.status === 'open').length,
      closedRegisters: registers.filter((r) => r.status === 'closed').length,
      totalVariance: registers.reduce((s, r) => s + r.variance, 0),
    },
  };
}

function mapDeposit(row: {
  id: string;
  guestName: string;
  roomNo: string | null;
  amount: number;
  method: string;
  status: string;
  takenAt: string;
}): DepositRow {
  return {
    id: row.id,
    guest: row.guestName,
    roomNo: row.roomNo ?? '—',
    amount: row.amount,
    method: row.method as DepositRow['method'],
    takenAt: row.takenAt,
    status: row.status as DepositRow['status'],
  };
}

export async function getDepositsServer(propertyId?: string): Promise<DepositRow[]> {
  await init();
  const rows = await prisma.deposit.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { takenAt: 'desc' },
  });
  return rows.map(mapDeposit);
}

export async function createDepositServer(
  data: {
    guestName: string;
    roomNo?: string;
    amount: number;
    method: DepositRow['method'];
    reservationId?: string;
    user?: string;
    notes?: string;
  },
  propertyId?: string,
): Promise<DepositRow> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const time = nowTime();
  const id = `dp-${Date.now()}`;
  const user = data.user ?? 'Resepsiyon';

  await prisma.$transaction([
    prisma.deposit.create({
      data: {
        id,
        propertyId: prop,
        reservationId: data.reservationId ?? null,
        guestName: data.guestName,
        roomNo: data.roomNo ?? null,
        amount: data.amount,
        method: data.method,
        status: 'held',
        takenAt: `${businessDate} ${time}`,
        user,
        notes: data.notes ?? null,
      },
    }),
    prisma.cashEntry.create({
      data: {
        id: `ce-dp-${Date.now()}`,
        propertyId: prop,
        businessDate,
        time,
        register: 'Ana Kasa',
        type: 'depozit',
        description: `Depozit — ${data.guestName}${data.roomNo ? ` · Oda ${data.roomNo}` : ''}`,
        amount: data.amount,
        currency: 'TRY',
        user,
        reservationId: data.reservationId ?? null,
      },
    }),
  ]);

  await appendAuditLog({
    module: 'deposit',
    action: 'create',
    entityType: 'Deposit',
    entityId: id,
    user,
    detail: `${data.guestName} · ${data.amount} TRY`,
  }, prop);
  bustReadCaches(prop);
  const row = await prisma.deposit.findUniqueOrThrow({ where: { id } });
  return mapDeposit(row);
}

export async function updateDepositStatusServer(
  id: string,
  status: DepositRow['status'],
  propertyId?: string,
): Promise<DepositRow | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.deposit.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.deposit.update({ where: { id }, data: { status } });
  bustReadCaches(prop);
  return mapDeposit(row);
}

export async function seedDepositsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.deposit.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const seeds = [
    { id: 'dp-seed-1', guestName: 'Marco Rossi', roomNo: '118', amount: 2000, method: 'kart', status: 'held', takenAt: '2026-06-18 14:05' },
    { id: 'dp-seed-2', guestName: 'Zeynep Ak', roomNo: '215', amount: 1500, method: 'nakit', status: 'applied', takenAt: '2026-06-17 16:20' },
    { id: 'dp-seed-3', guestName: 'John Miller', roomNo: '205', amount: 1000, method: 'kart', status: 'refunded', takenAt: '2026-06-16 11:00' },
  ];

  await prisma.deposit.createMany({
    data: seeds.map((s) => ({
      ...s,
      propertyId: prop,
      reservationId: null,
      user: 'Arda Y.',
      notes: null,
    })),
  });
}
