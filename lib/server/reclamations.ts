import type { ReclamationCase } from '@/lib/data/guest-relations';
import { DEMO_RECLAMATIONS } from '@/lib/data/guest-relations';
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
  refNo: string;
  date: string;
  guest: string;
  roomNo: string;
  subject: string;
  compensation: string;
  status: string;
}): ReclamationCase {
  return {
    id: r.id,
    refNo: r.refNo,
    date: r.date,
    guest: r.guest,
    roomNo: r.roomNo,
    subject: r.subject,
    compensation: r.compensation,
    status: r.status as ReclamationCase['status'],
  };
}

export async function seedReclamationsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.reclamationCase.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.reclamationCase.createMany({
    data: DEMO_RECLAMATIONS.map((r) => ({
      id: `rkl-${r.id}`,
      propertyId: prop,
      refNo: r.refNo,
      date: r.date,
      guest: r.guest,
      roomNo: r.roomNo,
      subject: r.subject,
      compensation: r.compensation,
      status: r.status,
      createdAt: now,
    })),
  });
}

export async function getReclamationsServer(propertyId?: string): Promise<ReclamationCase[]> {
  await init();
  await seedReclamationsIfEmpty(propertyId);
  const rows = await prisma.reclamationCase.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { date: 'desc' },
  });
  return rows.map(mapRow);
}

export async function saveReclamationServer(
  data: Omit<ReclamationCase, 'id' | 'refNo'> & { refNo?: string; id?: string },
  propertyId?: string,
): Promise<ReclamationCase> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);

  if (data.id) {
    const existing = await prisma.reclamationCase.findFirst({ where: { id: data.id, propertyId: prop } });
    if (existing) {
      const row = await prisma.reclamationCase.update({
        where: { id: data.id },
        data: {
          guest: data.guest,
          roomNo: data.roomNo,
          subject: data.subject,
          compensation: data.compensation,
          ...(data.status ? { status: data.status } : {}),
        },
      });
      bustReadCaches(prop);
      return mapRow(row);
    }
  }

  const id = data.id ?? `rkl-${Date.now()}`;
  const refNo = data.refNo ?? `RKL-${businessDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
  const row = await prisma.reclamationCase.create({
    data: {
      id,
      propertyId: prop,
      refNo,
      date: data.date || businessDate,
      guest: data.guest,
      roomNo: data.roomNo,
      subject: data.subject,
      compensation: data.compensation,
      status: data.status,
      createdAt: new Date().toISOString(),
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'reclamation_create',
    entityType: 'ReclamationCase',
    entityId: id,
    user: 'Misafir İlişkileri',
    detail: `${refNo} · ${data.guest}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function updateReclamationStatusServer(
  id: string,
  status: ReclamationCase['status'],
  propertyId?: string,
): Promise<ReclamationCase | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.reclamationCase.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.reclamationCase.update({ where: { id }, data: { status } });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteReclamationServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.reclamationCase.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.reclamationCase.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
