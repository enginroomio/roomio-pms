import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { addReservationServer, getAllReservationsServer, init } from '@/lib/server/pms-store';
import { appendAuditLog } from '@/lib/server/audit-log';
import type { Reservation } from '@/lib/types/reservation';

export type ReservationGroup = {
  id: string;
  refNo: string;
  name: string;
  contactName?: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  status: 'open' | 'confirmed' | 'checked_in' | 'closed';
  notes?: string;
  createdAt: string;
  memberCount?: number;
  allotment?: Record<string, number>;
};

export type GroupAllotmentStatus = {
  allotment: Record<string, number>;
  pickedUp: Record<string, number>;
  remaining: Record<string, number>;
  totalAllotted: number;
  totalPickedUp: number;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapGroup(r: {
  id: string;
  refNo: string;
  name: string;
  contactName: string | null;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  status: string;
  notes: string | null;
  createdAt: string;
  allotmentJson: string | null;
}): ReservationGroup {
  let allotment: Record<string, number> | undefined;
  if (r.allotmentJson) {
    try {
      allotment = JSON.parse(r.allotmentJson) as Record<string, number>;
    } catch {
      allotment = undefined;
    }
  }
  return {
    id: r.id,
    refNo: r.refNo,
    name: r.name,
    contactName: r.contactName ?? undefined,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    roomCount: r.roomCount,
    status: r.status as ReservationGroup['status'],
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
    allotment,
  };
}

function defaultAllotment(roomCount: number): Record<string, number> {
  const dbl = Math.max(1, Math.floor(roomCount * 0.7));
  const sui = Math.max(0, Math.floor(roomCount * 0.2));
  const trp = Math.max(0, roomCount - dbl - sui);
  const out: Record<string, number> = { DBL: dbl };
  if (sui > 0) out.SUI = sui;
  if (trp > 0) out.TRP = trp;
  return out;
}

export async function getReservationGroupsServer(propertyId?: string): Promise<ReservationGroup[]> {
  await init();
  const prop = pid(propertyId);
  const rows = await prisma.reservationGroup.findMany({
    where: { propertyId: prop },
    orderBy: { checkIn: 'desc' },
  });
  const reservations = await getAllReservationsServer(prop);
  return rows.map((r) => ({
    ...mapGroup(r),
    memberCount: reservations.filter((x) => x.groupId === r.id).length,
  }));
}

export async function createReservationGroupServer(
  data: {
    name: string;
    contactName?: string;
    checkIn: string;
    checkOut: string;
    roomCount: number;
    notes?: string;
    user?: string;
  },
  propertyId?: string,
): Promise<ReservationGroup> {
  await init();
  const prop = pid(propertyId);
  const id = `grp-${Date.now()}`;
  const refNo = `GRP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const allotment = defaultAllotment(data.roomCount);
  const row = await prisma.reservationGroup.create({
    data: {
      id,
      propertyId: prop,
      refNo,
      name: data.name,
      contactName: data.contactName ?? null,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      roomCount: data.roomCount,
      status: 'open',
      notes: data.notes ?? null,
      allotmentJson: JSON.stringify(allotment),
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });
  await appendAuditLog({
    module: 'group',
    action: 'create',
    entityType: 'ReservationGroup',
    entityId: id,
    user: data.user ?? 'Resepsiyon',
    detail: `${data.name} · ${data.roomCount} oda`,
  }, prop);
  bustReadCaches(prop);
  return mapGroup(row);
}

export async function addGroupMemberServer(
  groupId: string,
  reservation: Omit<Reservation, 'id' | 'refNo' | 'createdAt' | 'groupId'>,
  propertyId?: string,
): Promise<Reservation> {
  await init();
  const prop = pid(propertyId);
  const group = await prisma.reservationGroup.findFirst({ where: { id: groupId, propertyId: prop } });
  if (!group) throw new Error('Grup bulunamadı');

  const roomType = reservation.roomType ?? 'DBL';
  const allotmentStatus = await getGroupAllotmentStatusServer(groupId, prop);
  if (allotmentStatus && (allotmentStatus.remaining[roomType] ?? 0) <= 0) {
    throw new Error(`${roomType} allotment dolu (${allotmentStatus.pickedUp[roomType] ?? 0}/${allotmentStatus.allotment[roomType] ?? 0})`);
  }

  const saved = await addReservationServer({
    ...reservation,
    id: `grp-m-${Date.now()}`,
    refNo: `${group.refNo}-${Date.now().toString().slice(-3)}`,
    createdAt: new Date().toISOString().slice(0, 10),
    groupId,
    checkIn: reservation.checkIn || group.checkIn,
    checkOut: reservation.checkOut || group.checkOut,
    status: reservation.status ?? 'CONFIRMED',
  }, prop);

  await appendAuditLog({
    module: 'group',
    action: 'add_member',
    entityType: 'Reservation',
    entityId: saved.id,
    user: 'Resepsiyon',
    detail: `${saved.guestName} → ${group.name}`,
  }, prop);

  return { ...saved, groupId };
}

export async function getGroupMembersServer(groupId: string, propertyId?: string): Promise<Reservation[]> {
  const all = await getAllReservationsServer(propertyId);
  return all.filter((r) => r.groupId === groupId);
}

export async function setGroupAllotmentServer(
  groupId: string,
  allotment: Record<string, number>,
  propertyId?: string,
): Promise<ReservationGroup | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.reservationGroup.findFirst({ where: { id: groupId, propertyId: prop } });
  if (!existing) return null;
  const row = await prisma.reservationGroup.update({
    where: { id: groupId },
    data: { allotmentJson: JSON.stringify(allotment) },
  });
  bustReadCaches(prop);
  return mapGroup(row);
}

export async function getGroupAllotmentStatusServer(
  groupId: string,
  propertyId?: string,
): Promise<GroupAllotmentStatus | null> {
  await init();
  const prop = pid(propertyId);
  const group = await prisma.reservationGroup.findFirst({ where: { id: groupId, propertyId: prop } });
  if (!group) return null;

  const mapped = mapGroup(group);
  const allotment = mapped.allotment ?? defaultAllotment(group.roomCount);
  const members = await getGroupMembersServer(groupId, prop);
  const pickedUp: Record<string, number> = {};
  for (const m of members) {
    pickedUp[m.roomType] = (pickedUp[m.roomType] ?? 0) + 1;
  }

  const remaining: Record<string, number> = {};
  const keys = new Set([...Object.keys(allotment), ...Object.keys(pickedUp)]);
  for (const k of keys) {
    remaining[k] = Math.max(0, (allotment[k] ?? 0) - (pickedUp[k] ?? 0));
  }

  const totalAllotted = Object.values(allotment).reduce((s, n) => s + n, 0);
  const totalPickedUp = members.length;

  return { allotment, pickedUp, remaining, totalAllotted, totalPickedUp };
}
