import type { ComplaintItem } from '@/lib/data/guest-relations';
import { DEMO_COMPLAINTS } from '@/lib/data/guest-relations';
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
  roomNo: string;
  guest: string;
  category: string;
  description: string;
  priority: string;
  status: string;
}): ComplaintItem {
  return {
    id: r.id,
    date: r.date,
    roomNo: r.roomNo,
    guest: r.guest,
    category: r.category,
    description: r.description,
    priority: r.priority as ComplaintItem['priority'],
    status: r.status as ComplaintItem['status'],
  };
}

export async function seedGuestComplaintsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.guestComplaint.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.guestComplaint.createMany({
    data: DEMO_COMPLAINTS.map((c) => ({
      id: `gc-${c.id}`,
      propertyId: prop,
      date: c.date,
      roomNo: c.roomNo,
      guest: c.guest,
      category: c.category,
      description: c.description,
      priority: c.priority,
      status: c.status,
      resolvedAt: c.status === 'Çözüldü' ? now : null,
      createdAt: now,
    })),
  });
}

export async function getGuestComplaintsServer(propertyId?: string): Promise<ComplaintItem[]> {
  await init();
  await seedGuestComplaintsIfEmpty(propertyId);
  const rows = await prisma.guestComplaint.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapRow);
}

export async function saveGuestComplaintServer(
  data: Omit<ComplaintItem, 'id'> & { id?: string },
  propertyId?: string,
): Promise<ComplaintItem> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `gc-${Date.now()}`;
  const businessDate = await getBusinessDate(prop);
  const row = await prisma.guestComplaint.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      date: data.date || businessDate,
      roomNo: data.roomNo,
      guest: data.guest,
      category: data.category,
      description: data.description,
      priority: data.priority,
      status: data.status,
      resolvedAt: data.status === 'Çözüldü' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    },
    update: {
      date: data.date,
      roomNo: data.roomNo,
      guest: data.guest,
      category: data.category,
      description: data.description,
      priority: data.priority,
      status: data.status,
      resolvedAt: data.status === 'Çözüldü' ? new Date().toISOString() : null,
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'complaint_save',
    entityType: 'GuestComplaint',
    entityId: id,
    user: 'Misafir İlişkileri',
    detail: `${data.roomNo} · ${data.category}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function resolveGuestComplaintServer(id: string, propertyId?: string): Promise<ComplaintItem | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestComplaint.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.guestComplaint.update({
    where: { id },
    data: { status: 'Çözüldü', resolvedAt: new Date().toISOString() },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteGuestComplaintServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestComplaint.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.guestComplaint.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
