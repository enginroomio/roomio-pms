import { clearRoomCache } from '@/lib/rooms/inventory';
import { dispatchInventoryHydrated } from '@/lib/client/inventory-events';
import { setFloorsOverride, type FloorRange } from '@/lib/rooms/room-config';
import { setRoomTypesOverride, type RoomTypeDef } from '@/lib/rooms/room-types';

export type HydratedRoom = {
  roomNo: string;
  floor: number;
  typeCode: string;
  location?: string;
  building: string;
  isActive: boolean;
};

export type HydratedType = {
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
};

let dbRoomsOverride: HydratedRoom[] | null = null;

export function getHydratedRooms(): HydratedRoom[] | null {
  return dbRoomsOverride;
}

export function hydratePropertyInventory(data: {
  floors: FloorRange[];
  types: HydratedType[];
  rooms: HydratedRoom[];
}) {
  setFloorsOverride(data.floors);
  const types: Record<string, RoomTypeDef> = {};
  for (const t of data.types) {
    types[t.code] = {
      code: t.code as RoomTypeDef['code'],
      short: t.short,
      name: t.name,
      description: t.description ?? '',
      location: t.location ?? '',
      bedType: t.bedType,
      maxPersons: t.maxPersons,
      maxAdults: t.maxAdults,
      maxChildren: t.maxChildren,
      baseRate: t.baseRate,
      specialInfo: t.specialInfo,
    };
  }
  setRoomTypesOverride(types);
  dbRoomsOverride = data.rooms.filter((r) => r.isActive);
  clearRoomCache();
  dispatchInventoryHydrated();
}
