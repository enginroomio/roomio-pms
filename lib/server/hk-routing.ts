import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
import { bustReadCaches } from '@/lib/server/perf-cache';
import { getAllRoomsServer } from '@/lib/server/room-inventory-bridge';
import { init } from '@/lib/server/pms-store';

export type HkRoute = {
  id: string;
  code: string;
  name: string;
  floors: number[];
  staffName?: string;
  active: boolean;
  roomCount?: number;
};

const DEFAULT_ROUTES: Omit<HkRoute, 'id' | 'roomCount'>[] = [
  { code: 'A', name: 'Route A — Alt katlar', floors: [1, 2], staffName: 'Ayşe K.', active: true },
  { code: 'B', name: 'Route B — Orta katlar', floors: [3, 4], staffName: 'Murat Ş.', active: true },
  { code: 'C', name: 'Route C — Üst katlar', floors: [5, 6], staffName: 'Elif D.', active: true },
];

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function mapRoute(r: {
  id: string;
  code: string;
  name: string;
  floors: string;
  staffName: string | null;
  active: boolean;
}): HkRoute {
  let floors: number[] = [];
  try {
    floors = JSON.parse(r.floors) as number[];
  } catch {
    floors = [];
  }
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    floors,
    staffName: r.staffName ?? undefined,
    active: r.active,
  };
}

function routeForFloor(floor: number, routes: HkRoute[]): string | null {
  for (const route of routes) {
    if (route.floors.includes(floor)) return route.code;
  }
  return null;
}

export async function seedHkRoutesIfEmpty(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const count = await prisma.hkRoute.count({ where: { propertyId: prop } });
  if (count > 0) return;

  await prisma.hkRoute.createMany({
    data: DEFAULT_ROUTES.map((r, i) => ({
      id: `hkrt-seed-${i}`,
      propertyId: prop,
      code: r.code,
      name: r.name,
      floors: JSON.stringify(r.floors),
      staffName: r.staffName ?? null,
      active: r.active,
    })),
  });
}

export async function syncRoomRouteAssignments(propertyId?: string): Promise<void> {
  await init();
  const prop = pid(propertyId);
  const routes = await getHkRoutesServer(prop);
  const rooms = await getAllRoomsServer(prop);
  const now = new Date().toISOString();

  for (const room of rooms) {
    const routeCode = routeForFloor(room.floor, routes);
    await prisma.roomHousekeeping.upsert({
      where: { propertyId_roomNo: { propertyId: prop, roomNo: room.roomNo } },
      create: {
        id: `hk-${room.roomNo}`,
        propertyId: prop,
        roomNo: room.roomNo,
        hkStatus: 'CLEAN',
        routeCode,
        updatedAt: now,
      },
      update: { routeCode, updatedAt: now },
    });
  }
  bustReadCaches(prop);
}

export async function getHkRoutesServer(propertyId?: string): Promise<HkRoute[]> {
  await init();
  await seedHkRoutesIfEmpty(propertyId);
  const prop = pid(propertyId);
  const rows = await prisma.hkRoute.findMany({
    where: { propertyId: prop, active: true },
    orderBy: { code: 'asc' },
  });
  const routes = rows.map(mapRoute);

  const hkRooms = await prisma.roomHousekeeping.findMany({ where: { propertyId: prop } });
  return routes.map((r) => ({
    ...r,
    roomCount: hkRooms.filter((h) => h.routeCode === r.code).length,
  }));
}

export async function getRoomsByRouteServer(routeCode: string, propertyId?: string) {
  await syncRoomRouteAssignments(propertyId);
  const prop = pid(propertyId);
  return prisma.roomHousekeeping.findMany({
    where: { propertyId: prop, routeCode },
    orderBy: { roomNo: 'asc' },
  });
}

export async function saveHkRouteServer(
  data: Omit<HkRoute, 'id' | 'roomCount'> & { id?: string },
  propertyId?: string,
): Promise<HkRoute> {
  await init();
  const prop = pid(propertyId);
  const id = data.id ?? `hkrt-${Date.now()}`;
  const row = await prisma.hkRoute.upsert({
    where: { id },
    create: {
      id,
      propertyId: prop,
      code: data.code,
      name: data.name,
      floors: JSON.stringify(data.floors),
      staffName: data.staffName ?? null,
      active: data.active,
    },
    update: {
      code: data.code,
      name: data.name,
      floors: JSON.stringify(data.floors),
      staffName: data.staffName ?? null,
      active: data.active,
    },
  });
  await syncRoomRouteAssignments(prop);
  return mapRoute(row);
}
