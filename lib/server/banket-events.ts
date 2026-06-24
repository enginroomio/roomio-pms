import type { BanketReservation } from '@/lib/data/banket';
import { DEMO_BANKET } from '@/lib/data/banket';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  eventName: string;
  hall: string;
  date: string;
  startTime: string;
  endTime: string;
  pax: number;
  contact: string;
  status: string;
  revenue: number;
}): BanketReservation {
  return {
    id: r.id,
    eventName: r.eventName,
    hall: r.hall,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    pax: r.pax,
    contact: r.contact,
    status: r.status as BanketReservation['status'],
    revenue: r.revenue,
  };
}

export async function seedBanketEventsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.banketEvent.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.banketEvent.createMany({
    data: DEMO_BANKET.map((b) => ({
      id: b.id,
      propertyId: prop,
      eventName: b.eventName,
      hall: b.hall,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      pax: b.pax,
      contact: b.contact,
      status: b.status,
      revenue: b.revenue,
      createdAt: now,
    })),
  });
}

export async function getBanketEventsServer(propertyId?: string): Promise<BanketReservation[]> {
  await init();
  await seedBanketEventsIfEmpty(propertyId);
  const rows = await prisma.banketEvent.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return rows.map(mapRow);
}

export async function saveBanketEventServer(
  data: Omit<BanketReservation, 'id'> & { id?: string },
  propertyId?: string,
): Promise<BanketReservation> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `bnk-${Date.now()}`;
  const businessDate = await getBusinessDate(prop);
  const row = await prisma.banketEvent.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      eventName: data.eventName,
      hall: data.hall,
      date: data.date || businessDate,
      startTime: data.startTime,
      endTime: data.endTime,
      pax: data.pax,
      contact: data.contact,
      status: data.status,
      revenue: data.revenue,
      createdAt: new Date().toISOString(),
    },
    update: {
      eventName: data.eventName,
      hall: data.hall,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      pax: data.pax,
      contact: data.contact,
      status: data.status,
      revenue: data.revenue,
    },
  });

  await appendAuditLog({
    module: 'folio',
    action: 'banket_save',
    entityType: 'BanketEvent',
    entityId: id,
    user: 'F&B',
    detail: `${data.eventName} · ${data.hall}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function confirmBanketEventServer(id: string, propertyId?: string): Promise<BanketReservation | null> {
  await init();
  const prop = pid(propertyId);
  const row = await prisma.banketEvent.findFirst({ where: { id, propertyId: prop } });
  if (!row) return null;
  return saveBanketEventServer({
    ...mapRow(row),
    status: 'confirmed',
  }, prop);
}

export async function postBanketEventToFolioServer(
  eventId: string,
  reservationId: string,
  propertyId?: string,
  user = 'F&B',
): Promise<{ event: BanketReservation; folioLines: Awaited<ReturnType<typeof import('@/lib/server/folio-cash').postFolioChargeServer>> } | null> {
  await init();
  const prop = pid(propertyId);
  const row = await prisma.banketEvent.findFirst({ where: { id: eventId, propertyId: prop } });
  if (!row || row.revenue <= 0) return null;

  const { postFolioChargeServer } = await import('@/lib/server/folio-cash');
  const folioLines = await postFolioChargeServer(
    reservationId,
    row.revenue,
    `Banket — ${row.eventName} (${row.hall})`,
    prop,
    'guest',
  );

  await appendAuditLog({
    module: 'folio',
    action: 'banket_folio_post',
    entityType: 'BanketEvent',
    entityId: eventId,
    user,
    detail: `${row.eventName} → rez ${reservationId} · ₺${row.revenue}`,
  }, prop);

  return { event: mapRow(row), folioLines };
}
