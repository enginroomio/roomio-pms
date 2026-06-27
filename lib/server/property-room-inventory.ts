import { FLOORS, isRoomExcluded } from '@/lib/rooms/room-config';
import { ROOM_TYPES, typeCodeForSuffix } from '@/lib/rooms/room-types';
import { clearRoomCache } from '@/lib/rooms/inventory';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { init } from '@/lib/server/pms-store';

export type PropertyFloorRow = {
  id: string;
  floor: number;
  start: number;
  end: number;
  active: boolean;
  roomCount: number;
};

export type RoomTypeDefRow = {
  id: string;
  code: string;
  short: string;
  name: string;
  description?: string;
  location?: string;
  bedType: string;
  maxPersons: number;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  specialInfo?: string;
  active: boolean;
};

export type PropertyRoomRow = {
  id: string;
  roomNo: string;
  floor: number;
  typeCode: string;
  location?: string;
  building: string;
  isActive: boolean;
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function locationForRoom(floor: number, suffix: number): string {
  const koridor = suffix <= 9 ? 'sol koridor' : 'sağ koridor';
  return `${floor}. kat, ${koridor}`;
}

function countRoomsOnFloor(start: number, end: number): number {
  let count = 0;
  for (let num = start; num <= end; num++) {
    if (!isRoomExcluded(num)) count += 1;
  }
  return count;
}

export async function seedPropertyFloorsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.propertyFloor.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.propertyFloor.createMany({
    data: FLOORS.map((f) => ({
      id: `floor-${prop}-${f.floor}`,
      propertyId: prop,
      floor: f.floor,
      start: f.start,
      end: f.end,
      active: true,
    })),
  });
}

export async function seedRoomTypeDefsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.roomTypeDefinition.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.roomTypeDefinition.createMany({
    data: Object.values(ROOM_TYPES).map((t) => ({
      id: `rt-${prop}-${t.code}`,
      propertyId: prop,
      code: t.code,
      short: t.short,
      name: t.name,
      description: t.description,
      location: t.location,
      bedType: t.bedType,
      maxPersons: t.maxPersons,
      maxAdults: t.maxAdults,
      maxChildren: t.maxChildren,
      baseRate: t.baseRate,
      specialInfo: t.specialInfo ?? null,
      active: true,
    })),
  });
}

export async function seedPropertyRoomsIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.propertyRoom.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await seedPropertyFloorsIfEmpty(prop);
  const floors = await prisma.propertyFloor.findMany({ where: { propertyId: prop, active: true } });
  const rows: Array<{
    id: string;
    propertyId: string;
    roomNo: string;
    floor: number;
    typeCode: string;
    location: string;
    building: string;
    isActive: boolean;
  }> = [];

  for (const f of floors) {
    for (let num = f.start; num <= f.end; num++) {
      if (isRoomExcluded(num)) continue;
      const roomNo = String(num);
      const floor = Math.floor(num / 100);
      const suffix = num % 100;
      const typeCode = typeCodeForSuffix(suffix);
      rows.push({
        id: `room-${prop}-${roomNo}`,
        propertyId: prop,
        roomNo,
        floor,
        typeCode,
        location: locationForRoom(floor, suffix),
        building: 'Ana Bina',
        isActive: true,
      });
    }
  }

  await prisma.propertyRoom.createMany({ data: rows });
  await syncPropertyTotalRoomsServer(prop);
}

export async function getPropertyFloorsServer(propertyId?: string): Promise<PropertyFloorRow[]> {
  await init();
  await seedPropertyFloorsIfEmpty(propertyId);
  const rows = await prisma.propertyFloor.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { floor: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    floor: r.floor,
    start: r.start,
    end: r.end,
    active: r.active,
    roomCount: countRoomsOnFloor(r.start, r.end),
  }));
}

export async function getRoomTypeDefsServer(propertyId?: string): Promise<RoomTypeDefRow[]> {
  await init();
  await seedRoomTypeDefsIfEmpty(propertyId);
  const rows = await prisma.roomTypeDefinition.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { code: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    short: r.short,
    name: r.name,
    description: r.description ?? undefined,
    location: r.location ?? undefined,
    bedType: r.bedType,
    maxPersons: r.maxPersons,
    maxAdults: r.maxAdults,
    maxChildren: r.maxChildren,
    baseRate: r.baseRate,
    specialInfo: r.specialInfo ?? undefined,
    active: r.active,
  }));
}

export async function getPropertyRoomsServer(
  propertyId?: string,
  limit?: number,
): Promise<PropertyRoomRow[]> {
  await init();
  await seedPropertyRoomsIfEmpty(propertyId);
  const rows = await prisma.propertyRoom.findMany({
    where: { propertyId: pid(propertyId) },
    orderBy: { roomNo: 'asc' },
    ...(limit != null ? { take: limit } : {}),
  });
  return rows.map((r) => ({
    id: r.id,
    roomNo: r.roomNo,
    floor: r.floor,
    typeCode: r.typeCode,
    location: r.location ?? undefined,
    building: r.building,
    isActive: r.isActive,
  }));
}

export async function syncPropertyTotalRoomsServer(propertyId?: string): Promise<number> {
  await init();
  const prop = pid(propertyId);
  const count = await countPropertyRoomsServer(prop);
  await prisma.property.update({
    where: { id: prop },
    data: { totalRooms: count },
  });
  bustReadCaches(prop);
  return count;
}

export async function syncPropertyRoomsFromFloorsServer(propertyId?: string): Promise<number> {
  await init();
  const prop = pid(propertyId);
  await seedPropertyFloorsIfEmpty(prop);
  const floors = await prisma.propertyFloor.findMany({
    where: { propertyId: prop, active: true },
    orderBy: { floor: 'asc' },
  });

  const expectedRoomNos = new Set<string>();
  const rows: Array<{
    id: string;
    propertyId: string;
    roomNo: string;
    floor: number;
    typeCode: string;
    location: string;
    building: string;
    isActive: boolean;
  }> = [];

  for (const f of floors) {
    for (let num = f.start; num <= f.end; num++) {
      if (isRoomExcluded(num)) continue;
      const roomNo = String(num);
      expectedRoomNos.add(roomNo);
      const floor = Math.floor(num / 100);
      const suffix = num % 100;
      const typeCode = typeCodeForSuffix(suffix);
      rows.push({
        id: `room-${prop}-${roomNo}`,
        propertyId: prop,
        roomNo,
        floor,
        typeCode,
        location: locationForRoom(floor, suffix),
        building: 'Ana Bina',
        isActive: true,
      });
    }
  }

  for (const row of rows) {
    await prisma.propertyRoom.upsert({
      where: { id: row.id },
      create: row,
      update: {
        floor: row.floor,
        typeCode: row.typeCode,
        location: row.location,
        building: row.building,
        isActive: true,
      },
    });
  }

  if (expectedRoomNos.size > 0) {
    await prisma.propertyRoom.updateMany({
      where: {
        propertyId: prop,
        roomNo: { notIn: [...expectedRoomNos] },
      },
      data: { isActive: false },
    });
  }

  bustReadCaches(prop);
  clearRoomCache();
  await syncPropertyTotalRoomsServer(prop);
  return expectedRoomNos.size;
}

export async function savePropertyFloorServer(
  data: Omit<PropertyFloorRow, 'id' | 'roomCount'> & { id?: string },
  propertyId?: string,
): Promise<PropertyFloorRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `floor-${prop}-${data.floor}`;
  const row = await prisma.propertyFloor.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      floor: data.floor,
      start: data.start,
      end: data.end,
      active: data.active,
    },
    update: {
      start: data.start,
      end: data.end,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  clearRoomCache();
  await syncPropertyRoomsFromFloorsServer(prop);
  return {
    id: row.id,
    floor: row.floor,
    start: row.start,
    end: row.end,
    active: row.active,
    roomCount: countRoomsOnFloor(row.start, row.end),
  };
}

export async function saveRoomTypeDefServer(
  data: Omit<RoomTypeDefRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<RoomTypeDefRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `rt-${prop}-${data.code}`;
  const row = await prisma.roomTypeDefinition.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      short: data.short,
      name: data.name,
      description: data.description ?? null,
      location: data.location ?? null,
      bedType: data.bedType,
      maxPersons: data.maxPersons,
      maxAdults: data.maxAdults,
      maxChildren: data.maxChildren,
      baseRate: data.baseRate,
      specialInfo: data.specialInfo ?? null,
      active: data.active,
    },
    update: {
      short: data.short,
      name: data.name,
      description: data.description ?? null,
      location: data.location ?? null,
      bedType: data.bedType,
      maxPersons: data.maxPersons,
      maxAdults: data.maxAdults,
      maxChildren: data.maxChildren,
      baseRate: data.baseRate,
      specialInfo: data.specialInfo ?? null,
      active: data.active,
    },
  });
  bustReadCaches(prop);
  clearRoomCache();
  return {
    id: row.id,
    code: row.code,
    short: row.short,
    name: row.name,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    bedType: row.bedType,
    maxPersons: row.maxPersons,
    maxAdults: row.maxAdults,
    maxChildren: row.maxChildren,
    baseRate: row.baseRate,
    specialInfo: row.specialInfo ?? undefined,
    active: row.active,
  };
}

export async function savePropertyRoomServer(
  data: Omit<PropertyRoomRow, 'id'> & { id?: string },
  propertyId?: string,
): Promise<PropertyRoomRow> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `room-${prop}-${data.roomNo}`;
  const row = await prisma.propertyRoom.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      roomNo: data.roomNo,
      floor: data.floor,
      typeCode: data.typeCode,
      location: data.location ?? null,
      building: data.building,
      isActive: data.isActive,
    },
    update: {
      floor: data.floor,
      typeCode: data.typeCode,
      location: data.location ?? null,
      building: data.building,
      isActive: data.isActive,
    },
  });
  bustReadCaches(prop);
  clearRoomCache();
  await syncPropertyTotalRoomsServer(prop);
  return {
    id: row.id,
    roomNo: row.roomNo,
    floor: row.floor,
    typeCode: row.typeCode,
    location: row.location ?? undefined,
    building: row.building,
    isActive: row.isActive,
  };
}

export async function countPropertyRoomsServer(propertyId?: string): Promise<number> {
  await init();
  await seedPropertyRoomsIfEmpty(propertyId);
  return prisma.propertyRoom.count({ where: { propertyId: pid(propertyId), isActive: true } });
}
