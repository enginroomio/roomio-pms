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
  status: 'open' | 'confirmed' | 'checked_in' | 'closed' | 'released';
  notes?: string;
  createdAt: string;
  memberCount?: number;
  allotment?: Record<string, number>;
  releaseDays?: number;
  releaseDate?: string;
};

export type GroupAllotmentStatus = {
  allotment: Record<string, number>;
  pickedUp: Record<string, number>;
  remaining: Record<string, number>;
  totalAllotted: number;
  totalPickedUp: number;
  releaseDays?: number;
  releaseDate?: string;
};

export type GroupBlocksSummary = {
  groupCount: number;
  openBlocks: number;
  roomsAllotted: number;
  roomsPickedUp: number;
  pickupPct: number;
  dueForRelease: number;
};

const DEFAULT_RELEASE_DAYS = 7;

type AllotmentPayload = {
  rooms: Record<string, number>;
  releaseDays: number;
};

function parseAllotmentJson(json: string | null, roomCount: number): AllotmentPayload {
  if (!json) {
    return { rooms: defaultAllotment(roomCount), releaseDays: DEFAULT_RELEASE_DAYS };
  }
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const rooms: Record<string, number> = {};
    let releaseDays = DEFAULT_RELEASE_DAYS;
    for (const [key, value] of Object.entries(parsed)) {
      if (key === '_releaseDays' && typeof value === 'number') {
        releaseDays = Math.max(0, Math.min(90, value));
      } else if (!key.startsWith('_') && typeof value === 'number') {
        rooms[key] = value;
      }
    }
    if (!Object.keys(rooms).length) {
      return { rooms: defaultAllotment(roomCount), releaseDays };
    }
    return { rooms, releaseDays };
  } catch {
    return { rooms: defaultAllotment(roomCount), releaseDays: DEFAULT_RELEASE_DAYS };
  }
}

function serializeAllotmentJson(rooms: Record<string, number>, releaseDays: number): string {
  return JSON.stringify({ ...rooms, _releaseDays: releaseDays });
}

function releaseDateFor(checkIn: string, releaseDays: number): string {
  const d = new Date(checkIn);
  if (!Number.isFinite(d.getTime())) return checkIn;
  d.setDate(d.getDate() - releaseDays);
  return d.toISOString().slice(0, 10);
}

function roomAllotmentOnly(allotment: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(allotment)) {
    if (!key.startsWith('_') && typeof value === 'number') out[key] = value;
  }
  return out;
}

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
  const payload = parseAllotmentJson(r.allotmentJson, r.roomCount);
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
    allotment: payload.rooms,
    releaseDays: payload.releaseDays,
    releaseDate: releaseDateFor(r.checkIn, payload.releaseDays),
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
    releaseDays?: number;
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
      allotmentJson: serializeAllotmentJson(allotment, data.releaseDays ?? DEFAULT_RELEASE_DAYS),
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
  releaseDays?: number,
): Promise<ReservationGroup | null> {
  await init();
  const prop = pid(propertyId);
  const existing = await prisma.reservationGroup.findFirst({ where: { id: groupId, propertyId: prop } });
  if (!existing) return null;
  const current = parseAllotmentJson(existing.allotmentJson, existing.roomCount);
  const rooms = roomAllotmentOnly(allotment);
  const row = await prisma.reservationGroup.update({
    where: { id: groupId },
    data: {
      allotmentJson: serializeAllotmentJson(
        rooms,
        releaseDays ?? current.releaseDays,
      ),
    },
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
  const payload = parseAllotmentJson(group.allotmentJson, group.roomCount);
  const allotment = mapped.allotment ?? payload.rooms;
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

  return {
    allotment,
    pickedUp,
    remaining,
    totalAllotted,
    totalPickedUp,
    releaseDays: payload.releaseDays,
    releaseDate: releaseDateFor(group.checkIn, payload.releaseDays),
  };
}

export async function releaseGroupBlockServer(
  groupId: string,
  propertyId?: string,
  user = 'Resepsiyon',
): Promise<ReservationGroup | null> {
  await init();
  const prop = pid(propertyId);
  const group = await prisma.reservationGroup.findFirst({ where: { id: groupId, propertyId: prop } });
  if (!group) return null;

  const status = await getGroupAllotmentStatusServer(groupId, prop);
  if (!status) return null;

  const releasedAllotment = { ...status.pickedUp };
  const row = await prisma.reservationGroup.update({
    where: { id: groupId },
    data: {
      status: 'released',
      allotmentJson: serializeAllotmentJson(releasedAllotment, status.releaseDays ?? DEFAULT_RELEASE_DAYS),
    },
  });

  const releasedRooms = status.totalAllotted - status.totalPickedUp;
  await appendAuditLog({
    module: 'group',
    action: 'release_block',
    entityType: 'ReservationGroup',
    entityId: groupId,
    user,
    detail: `${group.name} · ${releasedRooms} oda envantere iade`,
  }, prop);

  bustReadCaches(prop);
  return mapGroup(row);
}

export async function getGroupBlocksSummaryServer(propertyId?: string): Promise<GroupBlocksSummary> {
  const groups = await getReservationGroupsServer(propertyId);
  let roomsAllotted = 0;
  let roomsPickedUp = 0;
  let openBlocks = 0;
  let dueForRelease = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const g of groups) {
    const status = await getGroupAllotmentStatusServer(g.id, propertyId);
    if (!status) continue;
    roomsAllotted += status.totalAllotted;
    roomsPickedUp += status.totalPickedUp;
    if (g.status === 'open' || g.status === 'confirmed') openBlocks += 1;
    if (
      status.releaseDate
      && status.releaseDate <= today
      && status.totalPickedUp < status.totalAllotted
      && g.status !== 'released'
    ) {
      dueForRelease += 1;
    }
  }

  return {
    groupCount: groups.length,
    openBlocks,
    roomsAllotted,
    roomsPickedUp,
    pickupPct: roomsAllotted > 0 ? Math.round((roomsPickedUp / roomsAllotted) * 100) : 0,
    dueForRelease,
  };
}
