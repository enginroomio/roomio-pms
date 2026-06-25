import { sendRolePush } from '@/lib/push/send';
import { appendAuditLog } from '@/lib/server/audit-log';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';

export type QueueRoomPriority = 'normal' | 'vip' | 'urgent';
export type QueueRoomStatus = 'waiting' | 'ready' | 'assigned' | 'cancelled';

export type QueueRoomRecord = {
  id: string;
  propertyId: string;
  reservationId?: string;
  refNo?: string;
  guestName: string;
  email?: string;
  phone?: string;
  roomType: string;
  adults: number;
  priority: QueueRoomPriority;
  status: QueueRoomStatus;
  notes?: string;
  assignedRoomNo?: string;
  queuedAt: string;
  readyAt?: string;
  assignedAt?: string;
  notifiedAt?: string;
  waitMinutes: number;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function waitMinutes(queuedAt: string): number {
  const ms = Date.now() - new Date(queuedAt).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}

function toRecord(row: {
  id: string;
  propertyId: string;
  reservationId: string | null;
  refNo: string | null;
  guestName: string;
  email: string | null;
  phone: string | null;
  roomType: string;
  adults: number;
  priority: string;
  status: string;
  notes: string | null;
  assignedRoomNo: string | null;
  queuedAt: string;
  readyAt: string | null;
  assignedAt: string | null;
  notifiedAt: string | null;
}): QueueRoomRecord {
  return {
    id: row.id,
    propertyId: row.propertyId,
    reservationId: row.reservationId ?? undefined,
    refNo: row.refNo ?? undefined,
    guestName: row.guestName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    roomType: row.roomType,
    adults: row.adults,
    priority: row.priority as QueueRoomPriority,
    status: row.status as QueueRoomStatus,
    notes: row.notes ?? undefined,
    assignedRoomNo: row.assignedRoomNo ?? undefined,
    queuedAt: row.queuedAt,
    readyAt: row.readyAt ?? undefined,
    assignedAt: row.assignedAt ?? undefined,
    notifiedAt: row.notifiedAt ?? undefined,
    waitMinutes: waitMinutes(row.queuedAt),
  };
}

export async function listQueueRooms(
  propertyId?: string,
  opts?: { status?: QueueRoomStatus | 'active' },
): Promise<QueueRoomRecord[]> {
  const prop = pid(propertyId);
  const where: { propertyId: string; status?: string | { in: string[] } } = { propertyId: prop };
  if (opts?.status === 'active') where.status = { in: ['waiting', 'ready'] };
  else if (opts?.status) where.status = opts.status;

  const rows = await prisma.queueRoom.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { queuedAt: 'asc' }],
  });
  return rows.map(toRecord);
}

export async function enqueueQueueRoom(input: {
  guestName: string;
  roomType: string;
  adults?: number;
  reservationId?: string;
  refNo?: string;
  email?: string;
  phone?: string;
  priority?: QueueRoomPriority;
  notes?: string;
  propertyId?: string;
}): Promise<QueueRoomRecord> {
  const prop = pid(input.propertyId);
  const now = new Date().toISOString();
  const row = await prisma.queueRoom.create({
    data: {
      id: `qroom-${prop}-${Date.now()}`,
      propertyId: prop,
      reservationId: input.reservationId ?? null,
      refNo: input.refNo ?? null,
      guestName: input.guestName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      roomType: input.roomType,
      adults: input.adults ?? 1,
      priority: input.priority ?? 'normal',
      status: 'waiting',
      notes: input.notes ?? null,
      queuedAt: now,
    },
  });

  await appendAuditLog({
    module: 'reception',
    action: 'queue_enqueue',
    entityType: 'QueueRoom',
    entityId: row.id,
    user: 'Resepsiyon',
    detail: `${input.guestName} · ${input.roomType}`,
  }, prop);

  bustReadCaches(prop);
  return toRecord(row);
}

export async function markQueueRoomReady(id: string, propertyId?: string): Promise<QueueRoomRecord> {
  const now = new Date().toISOString();
  const row = await prisma.queueRoom.update({
    where: { id },
    data: { status: 'ready', readyAt: now },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Queue entry not found');

  void sendRolePush('reception', {
    title: 'Oda hazır — kuyruk',
    body: `${row.guestName} için ${row.roomType} oda hazır`,
    tag: `queue-ready-${row.id}`,
    url: '/reception/queue',
    eventType: 'queue-room-ready',
  });

  bustReadCaches(row.propertyId);
  return toRecord(row);
}

export async function assignQueueRoom(
  id: string,
  roomNo: string,
  propertyId?: string,
): Promise<QueueRoomRecord> {
  const now = new Date().toISOString();
  const row = await prisma.queueRoom.update({
    where: { id },
    data: {
      status: 'assigned',
      assignedRoomNo: roomNo,
      assignedAt: now,
      notifiedAt: now,
    },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Queue entry not found');

  await appendAuditLog({
    module: 'reception',
    action: 'queue_assign',
    entityType: 'QueueRoom',
    entityId: row.id,
    user: 'Resepsiyon',
    detail: `${row.guestName} → Oda ${roomNo}`,
  }, row.propertyId);

  bustReadCaches(row.propertyId);
  return toRecord(row);
}

export async function cancelQueueRoom(id: string, propertyId?: string): Promise<QueueRoomRecord> {
  const row = await prisma.queueRoom.update({
    where: { id },
    data: { status: 'cancelled' },
  });
  if (row.propertyId !== pid(propertyId)) throw new Error('Queue entry not found');
  bustReadCaches(row.propertyId);
  return toRecord(row);
}

export async function ensureDemoQueueRoomsSeeded(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  const count = await prisma.queueRoom.count({
    where: { propertyId: prop, status: { in: ['waiting', 'ready'] } },
  });
  if (count > 0) return;

  const now = new Date(Date.now() - 25 * 60_000).toISOString();
  await prisma.queueRoom.create({
    data: {
      id: `qroom-seed-${prop}-1`,
      propertyId: prop,
      guestName: 'Ayşe Yılmaz',
      roomType: 'DBL',
      adults: 2,
      priority: 'vip',
      status: 'waiting',
      notes: 'Erken giriş — oda henüz temizlenmedi',
      queuedAt: now,
    },
  });
}
