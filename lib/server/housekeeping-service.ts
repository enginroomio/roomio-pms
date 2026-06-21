import { DEFAULT_HK_ROOMS, type HkRoomRecord } from '@/lib/data/hk-defaults';
import { getHousekeepingBoard, type HousekeepingBoardRow } from '@/lib/rooms/inventory';
import { getAllReservationsServer } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import type { RoomHkStatus } from '@/lib/types/room';

export type HkRoomState = HkRoomRecord & {
  roomNo: string;
  updatedAt: string;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

import { seedDatabaseIfEmpty } from '@/lib/server/seed';

const hkSeedLocks = new Map<string, Promise<void>>();

export async function ensureHkSeeded(propertyId?: string): Promise<void> {
  const prop = pid(propertyId);
  if (!hkSeedLocks.has(prop)) {
    hkSeedLocks.set(prop, doEnsureHk(prop));
  }
  await hkSeedLocks.get(prop)!;
}

async function doEnsureHk(prop: string): Promise<void> {
  await seedDatabaseIfEmpty();
  const count = await prisma.roomHousekeeping.count({ where: { propertyId: prop } });
  if (count > 0) return;

  const exists = await prisma.property.findUnique({ where: { id: prop } });
  if (!exists) return;

  const now = new Date().toISOString();
  try {
    await prisma.roomHousekeeping.createMany({
      data: Object.entries(DEFAULT_HK_ROOMS).map(([roomNo, row]) => ({
        id: `hk-${prop}-${roomNo}`,
        propertyId: prop,
        roomNo,
        hkStatus: row.hkStatus,
        assignedTo: row.assignedTo ?? null,
        notes: row.notes ?? null,
        updatedAt: now,
      })),
    });
  } catch {
    /* concurrent seed */
  }
}

export async function getHkRoomMap(propertyId?: string): Promise<Record<string, HkRoomRecord>> {
  await ensureHkSeeded(propertyId);
  const rows = await prisma.roomHousekeeping.findMany({ where: { propertyId: pid(propertyId) } });
  const map: Record<string, HkRoomRecord> = { ...DEFAULT_HK_ROOMS };
  for (const row of rows) {
    map[row.roomNo] = {
      hkStatus: row.hkStatus as RoomHkStatus,
      assignedTo: row.assignedTo ?? undefined,
      notes: row.notes ?? undefined,
    };
  }
  return map;
}

export async function getHousekeepingBoardServer(propertyId?: string): Promise<HousekeepingBoardRow[]> {
  const prop = pid(propertyId);
  const [reservations, hkMap] = await Promise.all([
    getAllReservationsServer(prop),
    getHkRoomMap(prop),
  ]);
  return getHousekeepingBoard(reservations, hkMap);
}

export async function getHkRooms(propertyId?: string): Promise<HkRoomState[]> {
  await ensureHkSeeded(propertyId);
  const rows = await prisma.roomHousekeeping.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { roomNo: 'asc' },
  });
  return rows.map((row) => ({
    roomNo: row.roomNo,
    hkStatus: row.hkStatus as RoomHkStatus,
    assignedTo: row.assignedTo ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updatedAt,
  }));
}

export async function updateHkRoom(
  roomNo: string,
  patch: Partial<HkRoomRecord>,
  propertyId?: string,
): Promise<HkRoomState> {
  const prop = pid(propertyId);
  await ensureHkSeeded(prop);
  const now = new Date().toISOString();
  const row = await prisma.roomHousekeeping.upsert({
    where: { propertyId_roomNo: { propertyId: prop, roomNo } },
    create: {
      id: `hk-${prop}-${roomNo}`,
      propertyId: prop,
      roomNo,
      hkStatus: patch.hkStatus ?? 'CLEAN',
      assignedTo: patch.assignedTo ?? null,
      notes: patch.notes ?? null,
      updatedAt: now,
    },
    update: {
      ...(patch.hkStatus !== undefined && { hkStatus: patch.hkStatus }),
      ...(patch.assignedTo !== undefined && { assignedTo: patch.assignedTo }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      updatedAt: now,
    },
  });
  return {
    roomNo: row.roomNo,
    hkStatus: row.hkStatus as RoomHkStatus,
    assignedTo: row.assignedTo ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updatedAt,
  };
}
