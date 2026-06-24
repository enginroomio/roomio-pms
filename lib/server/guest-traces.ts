import type { TraceItem } from '@/lib/data/guest-relations';
import { DEMO_TRACES } from '@/lib/data/guest-relations';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { getBusinessDate, init } from '@/lib/server/pms-store';

export type GuestTrace = TraceItem & { id: string; notes?: string };

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRow(r: {
  id: string;
  date: string;
  guest: string;
  roomNo: string;
  subject: string;
  due: string;
  status: string;
  assignee: string;
  notes: string | null;
}): GuestTrace {
  return {
    id: r.id,
    date: r.date,
    guest: r.guest,
    roomNo: r.roomNo,
    subject: r.subject,
    due: r.due,
    status: r.status as GuestTrace['status'],
    assignee: r.assignee,
    notes: r.notes ?? undefined,
  };
}

export async function seedGuestTracesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.guestTrace.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const now = new Date().toISOString();
  await prisma.guestTrace.createMany({
    data: DEMO_TRACES.map((t) => ({
      id: `gt-${t.id}`,
      propertyId: prop,
      date: t.date,
      guest: t.guest,
      roomNo: t.roomNo,
      subject: t.subject,
      due: t.due,
      status: t.status,
      assignee: t.assignee,
      notes: null,
      createdAt: now,
    })),
  });
}

export async function getGuestTracesServer(
  propertyId?: string,
  opts?: { status?: string },
): Promise<GuestTrace[]> {
  await init();
  await seedGuestTracesIfEmpty(propertyId);
  const rows = await prisma.guestTrace.findMany({
    where: {
      propertyId: pid(propertyId),
      ...(opts?.status ? { status: opts.status } : {}),
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map(mapRow);
}

export async function saveGuestTraceServer(
  data: Omit<GuestTrace, 'id'> & { id?: string },
  propertyId?: string,
): Promise<GuestTrace> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `gt-${Date.now()}`;
  const businessDate = await getBusinessDate(prop);
  const row = await prisma.guestTrace.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      date: data.date || businessDate,
      guest: data.guest,
      roomNo: data.roomNo,
      subject: data.subject,
      due: data.due,
      status: data.status,
      assignee: data.assignee,
      notes: data.notes ?? null,
      createdAt: new Date().toISOString(),
    },
    update: {
      date: data.date,
      guest: data.guest,
      roomNo: data.roomNo,
      subject: data.subject,
      due: data.due,
      status: data.status,
      assignee: data.assignee,
      notes: data.notes ?? null,
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: data.id ? 'trace_update' : 'trace_create',
    entityType: 'GuestTrace',
    entityId: id,
    user: data.assignee,
    detail: `${data.guest} · ${data.subject}`,
  }, prop);

  bustReadCaches(prop);
  return mapRow(row);
}

export async function completeGuestTraceServer(id: string, propertyId?: string): Promise<GuestTrace | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestTrace.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.guestTrace.update({
    where: { id },
    data: { status: 'Tamamlandı' },
  });
  bustReadCaches(prop);
  return mapRow(row);
}

export async function deleteGuestTraceServer(id: string, propertyId?: string): Promise<boolean> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.guestTrace.findFirst({ where: { id, propertyId: prop } });
  if (!existing) return false;
  await prisma.guestTrace.delete({ where: { id } });
  bustReadCaches(prop);
  return true;
}
