import { DEFAULT_HK_ROOMS, type HkRoomRecord } from '@/lib/data/hk-defaults';
import { getAllRooms } from '@/lib/rooms/inventory';
import type { RoomHkStatus, RoomRecord } from '@/lib/types/room';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import {
  countPropertyRoomsServer,
  getPropertyFloorsServer,
  getPropertyRoomsServer,
  getRoomTypeDefsServer,
  type PropertyRoomRow,
  type RoomTypeDefRow,
} from '@/lib/server/property-room-inventory';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function buildRoomFromDb(
  row: PropertyRoomRow,
  types: Map<string, RoomTypeDefRow>,
  hkMap: Record<string, HkRoomRecord>,
): RoomRecord {
  const num = parseInt(row.roomNo, 10);
  const suffix = num % 100;
  const def = types.get(row.typeCode);
  const hk = hkMap[row.roomNo];
  return {
    id: row.id,
    roomNo: row.roomNo,
    floor: row.floor,
    suffix,
    typeCode: row.typeCode,
    typeShort: def?.short ?? row.typeCode,
    typeName: def?.name ?? row.typeCode,
    bedType: def?.bedType ?? '—',
    maxPersons: def?.maxPersons ?? 2,
    maxAdults: def?.maxAdults ?? 2,
    maxChildren: def?.maxChildren ?? 0,
    baseRate: def?.baseRate ?? 0,
    location: row.location ?? `${row.floor}. kat`,
    building: row.building,
    specialInfo: def?.specialInfo,
    hkStatus: (hk?.hkStatus ?? 'CLEAN') as RoomHkStatus,
    isActive: row.isActive,
  };
}

export async function getAllRoomsServer(
  propertyId?: string,
  hkMap: Record<string, HkRoomRecord> = DEFAULT_HK_ROOMS,
): Promise<RoomRecord[]> {
  const prop = pid(propertyId);
  const [dbRooms, typeDefs] = await Promise.all([
    getPropertyRoomsServer(prop),
    getRoomTypeDefsServer(prop),
  ]);
  if (dbRooms.length === 0) return getAllRooms(hkMap);

  const types = new Map(typeDefs.filter((t) => t.active).map((t) => [t.code, t]));
  return dbRooms
    .filter((r) => r.isActive)
    .map((r) => buildRoomFromDb(r, types, hkMap));
}

export async function countTotalRoomsServer(propertyId?: string): Promise<number> {
  const count = await countPropertyRoomsServer(propertyId);
  return count > 0 ? count : getAllRooms().length;
}

export async function getPropertyInventoryPayload(propertyId?: string) {
  const prop = pid(propertyId);
  const [floors, types, rooms, total] = await Promise.all([
    getPropertyFloorsServer(prop),
    getRoomTypeDefsServer(prop),
    getPropertyRoomsServer(prop),
    countPropertyRoomsServer(prop),
  ]);
  return {
    floors: floors
      .filter((f) => f.active)
      .map((f) => ({ floor: f.floor, start: f.start, end: f.end })),
    types: types.filter((t) => t.active),
    rooms,
    totalRooms: total,
  };
}
