import type { LostFoundItem } from '@/lib/data/guest-relations';
import { DEMO_LOST_FOUND } from '@/lib/data/guest-relations';
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
  date: string;
  type: string;
  item: string;
  location: string;
  guest: string | null;
  roomNo: string | null;
  status: string;
}): LostFoundItem {
  return {
    id: r.id,
    date: r.date,
    type: r.type as LostFoundItem['type'],
    item: r.item,
    location: r.location,
    guest: r.guest ?? undefined,
    roomNo: r.roomNo ?? undefined,
    status: r.status as LostFoundItem['status'],
  };
}

export async function seedLostFoundIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.lostFoundItem.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.lostFoundItem.createMany({
    data: DEMO_LOST_FOUND.map((l) => ({
      id: `lf-${l.id}`,
      propertyId: prop,
      date: l.date,
      type: l.type,
      item: l.item,
      location: l.location,
      guest: l.guest ?? null,
      roomNo: l.roomNo ?? null,
      status: l.status,
      createdAt: now,
    })),
  });
}

export async function getLostFoundServer(propertyId?: string): Promise<LostFoundItem[]> {
  await init();
  await seedLostFoundIfEmpty(propertyId);
  const rows = await prisma.lostFoundItem.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapRow);
}

export async function saveLostFoundServer(
  data: Omit<LostFoundItem, 'id'> & { id?: string },
  propertyId?: string,
): Promise<LostFoundItem> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `lf-${Date.now()}`;
  const businessDate = await getBusinessDate(prop);
  const row = await prisma.lostFoundItem.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      date: data.date || businessDate,
      type: data.type,
      item: data.item,
      location: data.location,
      guest: data.guest ?? null,
      roomNo: data.roomNo ?? null,
      status: data.status,
      createdAt: new Date().toISOString(),
    },
    update: {
      date: data.date,
      type: data.type,
      item: data.item,
      location: data.location,
      guest: data.guest ?? null,
      roomNo: data.roomNo ?? null,
      status: data.status,
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'lost_found_save',
    entityType: 'LostFoundItem',
    entityId: id,
    user: 'Misafir İlişkileri',
    detail: `${data.type} · ${data.item}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function deliverLostFoundServer(id: string, propertyId?: string): Promise<LostFoundItem | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.lostFoundItem.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.lostFoundItem.update({
    where: { id },
    data: { status: 'Teslim' },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteLostFoundServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.lostFoundItem.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.lostFoundItem.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
