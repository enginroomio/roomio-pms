import type { RoomBlock } from '@/lib/data/room-blocks';
import type { FormLayout } from '@/lib/forms/form-catalog';
import type { TaxRule } from '@/lib/tax/types';
import { DEFAULT_TAX_RULES } from '@/lib/tax/types';
import type { ExchangeConfig } from '@/lib/exchange/config';
import { DEFAULT_EXCHANGE_CONFIG } from '@/lib/exchange/config';
import type { EgmGender, EgmIdType, EgmIdentityForm, EgmIdentityRecord, EgmNotifyStatus } from '@/lib/egm/types';
import { computeEgmStatus } from '@/lib/egm/types';
import { submitEgmToGateway } from '@/lib/integrations/egm/client';
import type { EodArchive } from '@/lib/data/eod';
import type { Reservation } from '@/lib/types/reservation';
import { PROPERTY } from '@/lib/navigation';
import { DEFAULT_PROPERTY_ID, type PropertyInfo } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { seedDatabaseIfEmpty } from '@/lib/server/seed';

export type IdentityNotification = {
  id: string;
  reservationId?: string;
  refNo?: string;
  guestName: string;
  firstName?: string;
  lastName?: string;
  roomNo: string;
  nationality: string;
  idNo: string;
  idType?: EgmIdType;
  birthDate?: string;
  birthPlace?: string;
  gender?: EgmGender;
  fatherName?: string;
  motherName?: string;
  checkIn: string;
  checkOut?: string;
  status: 'pending' | 'sent' | 'error' | EgmNotifyStatus;
  sentAt?: string;
  egmRef?: string;
  errorMessage?: string;
  createdAt: string;
};

function mapIdentityRow(r: {
  id: string;
  reservationId: string | null;
  refNo: string | null;
  guestName: string;
  firstName: string | null;
  lastName: string | null;
  roomNo: string;
  nationality: string;
  idNo: string;
  idType: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string | null;
  fatherName: string | null;
  motherName: string | null;
  checkIn: string;
  checkOut: string | null;
  status: string;
  sentAt: string | null;
  egmRef: string | null;
  errorMessage: string | null;
  createdAt: string;
}): IdentityNotification {
  const form: Partial<EgmIdentityForm> = {
    firstName: r.firstName ?? undefined,
    lastName: r.lastName ?? undefined,
    roomNo: r.roomNo,
    nationality: r.nationality,
    idNo: r.idNo,
    idType: (r.idType as EgmIdType | null) ?? undefined,
    birthDate: r.birthDate ?? undefined,
    birthPlace: r.birthPlace ?? undefined,
    gender: (r.gender as EgmGender | null) ?? undefined,
    fatherName: r.fatherName ?? undefined,
    motherName: r.motherName ?? undefined,
    checkIn: r.checkIn,
    checkOut: r.checkOut ?? undefined,
  };
  let status = r.status as IdentityNotification['status'];
  if (status === 'pending') status = computeEgmStatus(form);
  return {
    id: r.id,
    reservationId: r.reservationId ?? undefined,
    refNo: r.refNo ?? undefined,
    guestName: r.guestName,
    firstName: r.firstName ?? undefined,
    lastName: r.lastName ?? undefined,
    roomNo: r.roomNo,
    nationality: r.nationality,
    idNo: r.idNo,
    idType: (r.idType as EgmIdType | null) ?? undefined,
    birthDate: r.birthDate ?? undefined,
    birthPlace: r.birthPlace ?? undefined,
    gender: (r.gender as EgmGender | null) ?? undefined,
    fatherName: r.fatherName ?? undefined,
    motherName: r.motherName ?? undefined,
    checkIn: r.checkIn,
    checkOut: r.checkOut ?? undefined,
    status,
    sentAt: r.sentAt ?? undefined,
    egmRef: r.egmRef ?? undefined,
    errorMessage: r.errorMessage ?? undefined,
    createdAt: r.createdAt,
  };
}

function toEgmRecord(n: IdentityNotification): EgmIdentityRecord {
  return {
    id: n.id,
    reservationId: n.reservationId,
    refNo: n.refNo,
    guestName: n.guestName,
    firstName: n.firstName,
    lastName: n.lastName,
    roomNo: n.roomNo,
    nationality: n.nationality,
    idNo: n.idNo,
    idType: n.idType,
    birthDate: n.birthDate,
    birthPlace: n.birthPlace,
    gender: n.gender,
    fatherName: n.fatherName,
    motherName: n.motherName,
    checkIn: n.checkIn,
    checkOut: n.checkOut,
    status: (n.status === 'pending' ? 'draft' : n.status) as EgmNotifyStatus,
    sentAt: n.sentAt,
    egmRef: n.egmRef,
    errorMessage: n.errorMessage,
    createdAt: n.createdAt,
  };
}

export type Invoice = {
  id: string;
  no: string;
  date: string;
  guest: string;
  amount: number;
  vat: number;
  status: 'draft' | 'issued' | 'paid';
  type: 'konaklama' | 'ekstra' | 'banket';
};

export type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minQty: number;
  unitCost: number;
};

export type LedgerEntry = {
  id: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  ref?: string;
};

export type ReportTemplate = {
  id: string;
  name: string;
  module: string;
  columns: string[];
  kind: 'report' | 'form';
  pageId?: string;
  layout?: FormLayout;
  updatedAt: string;
};

function mapTemplate(row: {
  id: string; name: string; module: string; columns: string; kind: string;
  pageId: string | null; layout: string | null; updatedAt: string;
}): ReportTemplate {
  return {
    id: row.id,
    name: row.name,
    module: row.module,
    columns: JSON.parse(row.columns) as string[],
    kind: (row.kind === 'form' ? 'form' : 'report') as 'report' | 'form',
    pageId: row.pageId ?? undefined,
    layout: row.layout ? JSON.parse(row.layout) as FormLayout : undefined,
    updatedAt: row.updatedAt,
  };
}

function pid(propertyId?: string): string {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  initPromise ??= seedDatabaseIfEmpty().then(() => undefined);
  await initPromise;
}

function mapReservation(r: {
  id: string; refNo: string; guestName: string; email: string | null; phone: string | null;
  checkIn: string; checkOut: string; roomType: string; roomNo: string | null;
  adults: number; children: number; mealPlan: string; rate: number; currency: string;
  agency: string; market: string; status: string; createdAt: string; notes: string | null;
  extraData?: string | null;
}): Reservation {
  const extra = r.extraData ? JSON.parse(r.extraData) as Record<string, string> : undefined;
  return {
    id: r.id,
    refNo: r.refNo,
    guestName: r.guestName,
    email: r.email ?? undefined,
    phone: r.phone ?? undefined,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomType: r.roomType,
    roomNo: r.roomNo ?? undefined,
    adults: r.adults,
    children: r.children,
    mealPlan: r.mealPlan,
    rate: r.rate,
    currency: 'TRY',
    agency: r.agency,
    market: r.market,
    status: r.status as Reservation['status'],
    createdAt: r.createdAt,
    notes: r.notes ?? undefined,
    ...(extra ? { extraData: extra } : {}),
  } as Reservation;
}

function mapBlock(b: {
  id: string; roomNo: string; fromDate: string; toDate: string; reason: string; blockedBy: string; status: string;
}): RoomBlock {
  return { id: b.id, roomNo: b.roomNo, from: b.fromDate, to: b.toDate, reason: b.reason, blockedBy: b.blockedBy, status: b.status as RoomBlock['status'] };
}

function mapProperty(p: { id: string; code: string; name: string; city: string | null; totalRooms: number; isDefault: boolean }): PropertyInfo {
  return { id: p.id, code: p.code, name: p.name, city: p.city, totalRooms: p.totalRooms, isDefault: p.isDefault };
}

export async function getProperties(): Promise<PropertyInfo[]> {
  await init();
  const rows = await prisma.property.findMany({ orderBy: { name: 'asc' } });
  return rows.map(mapProperty);
}

export async function getProperty(propertyId: string): Promise<PropertyInfo | null> {
  await init();
  const row = await prisma.property.findUnique({ where: { id: propertyId } });
  return row ? mapProperty(row) : null;
}

export async function getAllReservationsServer(propertyId?: string): Promise<Reservation[]> {
  await init();
  const rows = await prisma.reservation.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { checkIn: 'desc' },
  });
  return rows.map(mapReservation);
}

export async function addReservationServer(reservation: Reservation, propertyId?: string): Promise<Reservation> {
  await init();
  const prop = pid(propertyId);
  const row = await prisma.reservation.create({
    data: {
      propertyId: prop,
      id: reservation.id,
      refNo: reservation.refNo,
      guestName: reservation.guestName,
      email: reservation.email ?? null,
      phone: reservation.phone ?? null,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      roomType: reservation.roomType,
      roomNo: reservation.roomNo ?? null,
      adults: reservation.adults,
      children: reservation.children,
      mealPlan: reservation.mealPlan,
      rate: reservation.rate,
      currency: reservation.currency,
      agency: reservation.agency,
      market: reservation.market,
      status: reservation.status,
      createdAt: reservation.createdAt,
      notes: reservation.notes ?? null,
      extraData: reservation.extraData ? JSON.stringify(reservation.extraData) : null,
    },
  });
  return mapReservation(row);
}

export async function getRoomBlocksServer(propertyId?: string): Promise<RoomBlock[]> {
  await init();
  const rows = await prisma.roomBlock.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { fromDate: 'desc' },
  });
  return rows.map(mapBlock);
}

export async function saveRoomBlocksServer(blocks: RoomBlock[], propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  await prisma.$transaction([
    prisma.roomBlock.deleteMany({ where: { propertyId: prop } }),
    prisma.roomBlock.createMany({
      data: blocks.map((b) => ({
        propertyId: prop,
        id: b.id,
        roomNo: b.roomNo,
        fromDate: b.from,
        toDate: b.to,
        reason: b.reason,
        blockedBy: b.blockedBy,
        status: b.status,
      })),
    }),
  ]);
}

export async function getBusinessDate(propertyId?: string): Promise<string> {
  await init();
  const state = await prisma.appState.findUnique({ where: { propertyId: pid(propertyId) } });
  return state?.businessDate ?? PROPERTY.businessDate;
}

export async function closeBusinessDay(closedBy: string, propertyId?: string): Promise<{ ok: true; archive: EodArchive; newDate: string }> {
  await init();
  const prop = pid(propertyId);
  const property = await prisma.property.findUnique({ where: { id: prop } });
  const totalRooms = property?.totalRooms ?? PROPERTY.totalRooms;
  const businessDate = await getBusinessDate(prop);
  const reservations = await getAllReservationsServer(prop);
  const inHouse = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const occupancy = Math.round((inHouse / totalRooms) * 100);
  const revenue = 284500 + Math.floor(Math.random() * 20000);

  const archive: EodArchive = {
    id: `arc-${Date.now()}`,
    businessDate,
    closedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    closedBy,
    occupancy,
    revenue,
  };

  const next = new Date(businessDate);
  next.setDate(next.getDate() + 1);
  const newDate = next.toISOString().slice(0, 10);

  await prisma.$transaction([
    prisma.eodArchive.create({
      data: { id: archive.id, propertyId: prop, businessDate: archive.businessDate, closedAt: archive.closedAt, closedBy: archive.closedBy, occupancy: archive.occupancy, revenue: archive.revenue },
    }),
    prisma.appState.upsert({
      where: { propertyId: prop },
      create: { propertyId: prop, businessDate: newDate, lastEodClose: archive.closedAt },
      update: { businessDate: newDate, lastEodClose: archive.closedAt },
    }),
  ]);

  return { ok: true, archive, newDate };
}

export async function getEodArchiveServer(propertyId?: string): Promise<EodArchive[]> {
  await init();
  return prisma.eodArchive.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { businessDate: 'desc' },
  });
}

export async function getIdentityNotifications(propertyId?: string): Promise<IdentityNotification[]> {
  await init();
  const rows = await prisma.identityNotification.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapIdentityRow);
}

export async function getEgmIdentities(propertyId?: string): Promise<EgmIdentityRecord[]> {
  const rows = await getIdentityNotifications(propertyId);
  return rows.map(toEgmRecord);
}

export async function upsertEgmIdentity(form: EgmIdentityForm, propertyId?: string): Promise<EgmIdentityRecord> {
  await init();
  const prop = pid(propertyId);
  const guestName = `${form.firstName} ${form.lastName}`.trim();
  const status = computeEgmStatus(form);
  const now = new Date().toISOString();

  const existing = form.reservationId
    ? await prisma.identityNotification.findFirst({ where: { propertyId: prop, reservationId: form.reservationId } })
    : form.refNo
      ? await prisma.identityNotification.findFirst({ where: { propertyId: prop, refNo: form.refNo } })
      : null;

  const data = {
    guestName,
    reservationId: form.reservationId ?? null,
    refNo: form.refNo ?? null,
    firstName: form.firstName,
    lastName: form.lastName,
    roomNo: form.roomNo,
    nationality: form.nationality,
    idNo: form.idNo,
    idType: form.idType,
    birthDate: form.birthDate || null,
    birthPlace: form.birthPlace || null,
    gender: form.gender || null,
    fatherName: form.fatherName || null,
    motherName: form.motherName || null,
    checkIn: form.checkIn,
    checkOut: form.checkOut ?? null,
    status,
  };

  const row = existing
    ? await prisma.identityNotification.update({ where: { id: existing.id }, data })
    : await prisma.identityNotification.create({
        data: {
          ...data,
          propertyId: prop,
          id: `egm-${Date.now()}`,
          createdAt: now,
        },
      });

  return toEgmRecord(mapIdentityRow(row));
}

export async function sendEgmIdentity(id: string): Promise<EgmIdentityRecord | null> {
  await init();
  const sentAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const existing = await prisma.identityNotification.findUnique({ where: { id } });
    if (!existing) return null;
    const mapped = mapIdentityRow(existing);
    if (computeEgmStatus({
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      roomNo: mapped.roomNo,
      nationality: mapped.nationality,
      idNo: mapped.idNo,
      idType: mapped.idType,
      birthDate: mapped.birthDate,
      birthPlace: mapped.birthPlace,
      gender: mapped.gender,
      fatherName: mapped.fatherName,
      motherName: mapped.motherName,
      checkIn: mapped.checkIn,
    }) !== 'ready') {
      return null;
    }

    const gateway = await submitEgmToGateway({
      firstName: mapped.firstName,
      lastName: mapped.lastName,
      roomNo: mapped.roomNo,
      nationality: mapped.nationality,
      idNo: mapped.idNo,
      idType: mapped.idType,
      birthDate: mapped.birthDate,
      birthPlace: mapped.birthPlace,
      gender: mapped.gender,
      fatherName: mapped.fatherName,
      motherName: mapped.motherName,
      checkIn: mapped.checkIn,
      checkOut: mapped.checkOut,
    });
    if (!gateway.ok) {
      await prisma.identityNotification.update({
        where: { id },
        data: { status: 'error', errorMessage: gateway.message },
      });
      return null;
    }

    const egmRef = gateway.egmRef ?? `EGM-${Date.now().toString(36).toUpperCase()}`;
    const row = await prisma.identityNotification.update({
      where: { id },
      data: { status: 'sent', sentAt, egmRef, errorMessage: gateway.simulated ? gateway.message : null },
    });
    return toEgmRecord(mapIdentityRow(row));
  } catch {
    return null;
  }
}

export async function addIdentityNotification(
  entry: Omit<IdentityNotification, 'id' | 'createdAt' | 'status'>,
  propertyId?: string,
): Promise<IdentityNotification> {
  await init();
  const row = await prisma.identityNotification.create({
    data: {
      propertyId: pid(propertyId),
      id: `id-${Date.now()}`,
      guestName: entry.guestName,
      roomNo: entry.roomNo,
      nationality: entry.nationality,
      idNo: entry.idNo,
      checkIn: entry.checkIn,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
  return mapIdentityRow(row);
}

export async function markIdentitySent(id: string): Promise<IdentityNotification | null> {
  await init();
  const sentAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const row = await prisma.identityNotification.update({
      where: { id },
      data: { status: 'sent', sentAt, egmRef: `EGM-${Date.now().toString(36).toUpperCase()}` },
    });
    return mapIdentityRow(row);
  } catch {
    return null;
  }
}

export async function getInvoices(propertyId?: string): Promise<Invoice[]> {
  await init();
  const rows = await prisma.invoice.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { date: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    no: r.no,
    date: r.date,
    guest: r.guest,
    amount: r.amount,
    vat: r.vat,
    status: r.status as Invoice['status'],
    type: r.type as Invoice['type'],
  }));
}

export async function getStockItems(propertyId?: string): Promise<StockItem[]> {
  await init();
  return prisma.stockItem.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { name: 'asc' },
  });
}

export async function addStockMovement(stockId: string, type: 'in' | 'out', qty: number, note?: string, userId?: string): Promise<StockItem | null> {
  await init();
  const item = await prisma.stockItem.findUnique({ where: { id: stockId } });
  if (!item) return null;
  const delta = type === 'in' ? qty : -qty;
  const newQty = item.qty + delta;
  if (newQty < 0) return null;

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: { id: `mv-${Date.now()}`, stockId, date: new Date().toISOString().slice(0, 10), type, qty, note: note ?? null, userId: userId ?? null },
    }),
    prisma.stockItem.update({ where: { id: stockId }, data: { qty: newQty } }),
  ]);

  return prisma.stockItem.findUnique({ where: { id: stockId } });
}

export async function getLedgerEntries(propertyId?: string): Promise<LedgerEntry[]> {
  await init();
  const rows = await prisma.ledgerEntry.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { date: 'desc' },
  });
  return rows.map((r) => ({ id: r.id, date: r.date, account: r.account, description: r.description, debit: r.debit, credit: r.credit, ref: r.ref ?? undefined }));
}

export async function addLedgerEntry(entry: Omit<LedgerEntry, 'id'>, propertyId?: string): Promise<LedgerEntry> {
  await init();
  const row = await prisma.ledgerEntry.create({
    data: { id: `lg-${Date.now()}`, propertyId: pid(propertyId), ...entry, ref: entry.ref ?? null },
  });
  return { id: row.id, date: row.date, account: row.account, description: row.description, debit: row.debit, credit: row.credit, ref: row.ref ?? undefined };
}

export async function getReportTemplates(propertyId?: string, kind?: 'report' | 'form'): Promise<ReportTemplate[]> {
  await init();
  const rows = await prisma.reportTemplate.findMany({
    where: { propertyId: pid(propertyId), ...(kind ? { kind } : {}) },
    orderBy: { name: 'asc' },
  });
  return rows.map(mapTemplate);
}

export async function getFormTemplateForPage(pageId: string, propertyId?: string): Promise<ReportTemplate | null> {
  await init();
  const row = await prisma.reportTemplate.findFirst({
    where: { propertyId: pid(propertyId), kind: 'form', pageId },
    orderBy: { updatedAt: 'desc' },
  });
  return row ? mapTemplate(row) : null;
}

export async function getReportTemplate(id: string, propertyId?: string): Promise<ReportTemplate | null> {
  await init();
  const row = await prisma.reportTemplate.findFirst({
    where: { id, propertyId: pid(propertyId) },
  });
  if (!row) return null;
  return mapTemplate(row);
}

export async function saveReportTemplate(
  tpl: {
    id?: string;
    name: string;
    module: string;
    columns: string[];
    kind?: 'report' | 'form';
    pageId?: string;
    layout?: FormLayout;
  },
  propertyId?: string,
): Promise<ReportTemplate> {
  await init();
  const prop = pid(propertyId);
  const id = tpl.id ?? `tpl-${Date.now()}`;
  const updatedAt = new Date().toISOString().slice(0, 10);
  const kind = tpl.kind ?? 'report';
  const data = {
    name: tpl.name,
    module: tpl.module,
    columns: JSON.stringify(tpl.columns),
    kind,
    pageId: tpl.pageId ?? null,
    layout: tpl.layout ? JSON.stringify(tpl.layout) : null,
    updatedAt,
  };
  const row = await prisma.reportTemplate.upsert({
    where: { id },
    create: { id, propertyId: prop, ...data },
    update: data,
  });
  return mapTemplate(row);
}

export async function deleteReportTemplate(id: string, propertyId?: string): Promise<boolean> {
  await init();
  try {
    await prisma.reportTemplate.deleteMany({ where: { id, propertyId: pid(propertyId) } });
    return true;
  } catch {
    return false;
  }
}

async function ensureTaxRules(propertyId: string): Promise<void> {
  const count = await prisma.taxRule.count({ where: { propertyId } });
  if (count > 0) return;
  await prisma.taxRule.createMany({
    data: DEFAULT_TAX_RULES.map((r, i) => ({
      id: `tax-${propertyId}-${r.code}`,
      propertyId,
      ...r,
      sortOrder: i + 1,
    })),
  });
}

export async function getTaxRules(propertyId?: string): Promise<TaxRule[]> {
  await init();
  const prop = pid(propertyId);
  await ensureTaxRules(prop);
  const rows = await prisma.taxRule.findMany({
    where: { propertyId: prop },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    rate: r.rate,
    base: r.base as TaxRule['base'],
    appliesTo: r.appliesTo as TaxRule['appliesTo'],
    active: r.active,
    sortOrder: r.sortOrder,
  }));
}

export async function saveTaxRules(rules: TaxRule[], propertyId?: string): Promise<TaxRule[]> {
  await init();
  const prop = pid(propertyId);
  await prisma.$transaction(
    rules.map((r) => prisma.taxRule.upsert({
      where: { propertyId_code: { propertyId: prop, code: r.code } },
      create: {
        id: r.id || `tax-${prop}-${r.code}`,
        propertyId: prop,
        code: r.code,
        name: r.name,
        rate: r.rate,
        base: r.base,
        appliesTo: r.appliesTo,
        active: r.active,
        sortOrder: r.sortOrder,
      },
      update: {
        name: r.name,
        rate: r.rate,
        base: r.base,
        appliesTo: r.appliesTo,
        active: r.active,
        sortOrder: r.sortOrder,
      },
    })),
  );
  return getTaxRules(prop);
}

async function ensureExchangeConfig(propertyId: string): Promise<void> {
  const row = await prisma.exchangeConfig.findUnique({ where: { propertyId } });
  if (row) return;
  await prisma.exchangeConfig.create({
    data: {
      propertyId,
      exchangeDiscountPct: DEFAULT_EXCHANGE_CONFIG.exchangeDiscountPct,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function getExchangeConfig(propertyId?: string): Promise<ExchangeConfig> {
  await init();
  const prop = pid(propertyId);
  await ensureExchangeConfig(prop);
  const row = await prisma.exchangeConfig.findUniqueOrThrow({ where: { propertyId: prop } });
  return {
    exchangeDiscountPct: row.exchangeDiscountPct,
    updatedAt: row.updatedAt,
  };
}

export async function saveExchangeConfig(config: ExchangeConfig, propertyId?: string): Promise<ExchangeConfig> {
  await init();
  const prop = pid(propertyId);
  const updatedAt = new Date().toISOString();
  await prisma.exchangeConfig.upsert({
    where: { propertyId: prop },
    create: {
      propertyId: prop,
      exchangeDiscountPct: config.exchangeDiscountPct,
      updatedAt,
    },
    update: {
      exchangeDiscountPct: config.exchangeDiscountPct,
      updatedAt,
    },
  });
  return getExchangeConfig(prop);
}

export async function getLocaleMessages(propertyId: string, locale: string): Promise<Record<string, string>> {
  await init();
  const rows = await prisma.localeEntry.findMany({ where: { propertyId, locale } });
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function upsertLocaleEntry(propertyId: string, locale: string, key: string, value: string): Promise<void> {
  await init();
  const existing = await prisma.localeEntry.findFirst({ where: { propertyId, locale, key } });
  if (existing) {
    await prisma.localeEntry.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.localeEntry.create({
      data: { id: `loc-${Date.now()}`, propertyId, locale, key, value },
    });
  }
}

export async function findUserByEmail(email: string) {
  await init();
  return prisma.user.findUnique({ where: { email } });
}
