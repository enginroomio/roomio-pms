import { DEFAULT_HK_ROOMS, type HkRoomRecord } from '@/lib/data/hk-defaults';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { PROPERTY } from '@/lib/navigation';
import { getActiveFloors, isRoomExcluded } from '@/lib/rooms/room-config';
import { getHydratedRooms } from '@/lib/rooms/inventory-hydrate';
import { getRoomTypeDef, getActiveRoomTypes, type RoomTypeCode, typeCodeForSuffix } from '@/lib/rooms/room-types';
import type { Reservation } from '@/lib/types/reservation';
import type { RackCell, RackCellState, RoomHkStatus, RoomRecord } from '@/lib/types/room';

function locationForRoom(floor: number, suffix: number): string {
  const koridor = suffix <= 9 ? 'sol koridor' : 'sağ koridor';
  return `${floor}. kat, ${koridor}`;
}

function buildRoom(num: number, hkMap: Record<string, HkRoomRecord>): RoomRecord {
  const roomNo = String(num);
  const floor = Math.floor(num / 100);
  const suffix = num % 100;
  const typeCode = typeCodeForSuffix(suffix);
  const def = getRoomTypeDef(typeCode)!;
  const hk = hkMap[roomNo];
  return {
    id: `room-${roomNo}`,
    roomNo,
    floor,
    suffix,
    typeCode: def.code,
    typeShort: def.short,
    typeName: def.name,
    bedType: def.bedType,
    maxPersons: def.maxPersons,
    maxAdults: def.maxAdults,
    maxChildren: def.maxChildren,
    baseRate: def.baseRate,
    location: locationForRoom(floor, suffix),
    building: 'Ana Bina',
    specialInfo: def.specialInfo,
    hkStatus: hk?.hkStatus ?? 'CLEAN',
    isActive: true,
  };
}

function buildRoomFromHydrated(
  row: NonNullable<ReturnType<typeof getHydratedRooms>>[number],
  hkMap: Record<string, HkRoomRecord>,
): RoomRecord {
  const num = parseInt(row.roomNo, 10);
  const suffix = num % 100;
  const def = getRoomTypeDef(row.typeCode);
  const hk = hkMap[row.roomNo];
  return {
    id: `room-${row.roomNo}`,
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
    hkStatus: hk?.hkStatus ?? 'CLEAN',
    isActive: row.isActive,
  };
}

function buildAllRooms(hkMap: Record<string, HkRoomRecord>): RoomRecord[] {
  const hydrated = getHydratedRooms();
  if (hydrated?.length) {
    return hydrated.map((r) => buildRoomFromHydrated(r, hkMap));
  }

  const rooms: RoomRecord[] = [];
  for (const { start, end } of getActiveFloors()) {
    for (let num = start; num <= end; num++) {
      if (isRoomExcluded(num)) continue;
      rooms.push(buildRoom(num, hkMap));
    }
  }
  return rooms;
}

let _cache: RoomRecord[] | null = null;

export function getAllRooms(hkMap: Record<string, HkRoomRecord> = DEFAULT_HK_ROOMS): RoomRecord[] {
  if (hkMap === DEFAULT_HK_ROOMS && _cache) return _cache;
  const rooms = buildAllRooms(hkMap);
  if (hkMap === DEFAULT_HK_ROOMS) _cache = rooms;
  return rooms;
}

export function clearRoomCache() {
  _cache = null;
}

export function getRoomByNumber(roomNo: string, hkMap?: Record<string, HkRoomRecord>): RoomRecord | undefined {
  return getAllRooms(hkMap).find((r) => r.roomNo === roomNo);
}

export function getRoomsByFloor(floor: number, hkMap?: Record<string, HkRoomRecord>): RoomRecord[] {
  return getAllRooms(hkMap).filter((r) => r.floor === floor);
}

export function getRoomTypesList() {
  return getActiveRoomTypes();
}

const TODAY = PROPERTY.businessDate;

function reservationForRoom(roomNo: string, reservations: Reservation[]) {
  return reservations.find((r) => r.roomNo === roomNo && r.status === 'CHECKED_IN');
}

function classifyRoom(room: RoomRecord, today: string, reservations: Reservation[]): RackCellState {
  if (room.hkStatus === 'OOS') return 'ooi';
  if (room.hkStatus === 'OOO') return 'ariza';

  const res = reservationForRoom(room.roomNo, reservations);
  const occupied = Boolean(res);
  const checkout = occupied && res?.checkOut === today;

  if (checkout) return 'checkout';

  if (occupied) {
    if (room.hkStatus === 'DIRTY') return 'dolu-kirli';
    if (room.hkStatus === 'INSPECT') return 'onayli';
    return 'dolu-temiz';
  }

  if (room.hkStatus === 'DIRTY') return 'kirli';
  if (room.hkStatus === 'INSPECT') return 'onayli';
  return 'temiz';
}

export function buildRackCells(
  floor?: number,
  reservations: Reservation[] = DEMO_RESERVATIONS,
  businessDate: string = TODAY,
  hkMap: Record<string, HkRoomRecord> = DEFAULT_HK_ROOMS,
  roomsOverride?: RoomRecord[],
): RackCell[] {
  const rooms = roomsOverride ?? (floor ? getRoomsByFloor(floor, hkMap) : getAllRooms(hkMap));
  return rooms.map((room) => {
    const res = reservationForRoom(room.roomNo, reservations);
    const state = classifyRoom(room, businessDate, reservations);
    return {
      room,
      state,
      guestName: res?.guestName,
      guestCode: res?.refNo.slice(-4),
      checkoutToday: res?.checkOut === businessDate,
      occupied: Boolean(res?.status === 'CHECKED_IN'),
    };
  });
}

export const RACK_LEGEND: { id: RackCellState; label: string; color: string; text: string }[] = [
  { id: 'dolu-temiz', label: 'Dolu Temiz', color: '#00bcd4', text: '#003d47' },
  { id: 'dolu-kirli', label: 'Dolu Kirli', color: '#2196f3', text: '#0d2d52' },
  { id: 'checkout', label: 'C/Out', color: '#ffeb3b', text: '#5c4a00' },
  { id: 'temiz', label: 'Temiz', color: '#8bc34a', text: '#1b3d0d' },
  { id: 'kirli', label: 'Kirli', color: '#1565c0', text: '#e3f2fd' },
  { id: 'onayli', label: 'Onaylı', color: '#ffffff', text: '#1e293b' },
  { id: 'ooi', label: 'OOI', color: '#ef5350', text: '#fff' },
  { id: 'ariza', label: 'Arıza', color: '#c62828', text: '#fff' },
];

export function countRackByState(cells: RackCell[]): Record<RackCellState, number> {
  const counts = Object.fromEntries(RACK_LEGEND.map((l) => [l.id, 0])) as Record<RackCellState, number>;
  for (const c of cells) counts[c.state] += 1;
  return counts;
}

export function getVacantRooms(
  reservations: Reservation[] = DEMO_RESERVATIONS,
  hkMap: Record<string, HkRoomRecord> = DEFAULT_HK_ROOMS,
): { roomNo: string; floor: number; type: string; status: 'CLEAN' | 'DIRTY' }[] {
  return getAllRooms(hkMap)
    .filter((r) => !reservationForRoom(r.roomNo, reservations) && r.hkStatus !== 'OOO' && r.hkStatus !== 'OOS')
    .map((r) => ({
      roomNo: r.roomNo,
      floor: r.floor,
      type: r.typeCode,
      status: r.hkStatus === 'DIRTY' ? 'DIRTY' : 'CLEAN',
    }));
}

export type HousekeepingBoardRow = {
  id: string;
  roomNo: string;
  floor: number;
  type: string;
  status: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO' | 'DND';
  assignedTo?: string;
  lastUpdated: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
};

export function getHousekeepingBoard(
  reservations: Reservation[] = DEMO_RESERVATIONS,
  hkMap: Record<string, HkRoomRecord> = DEFAULT_HK_ROOMS,
): HousekeepingBoardRow[] {
  const map: Record<RoomHkStatus, HousekeepingBoardRow['status']> = {
    CLEAN: 'CLEAN',
    DIRTY: 'DIRTY',
    INSPECT: 'INSPECT',
    OOO: 'OOO',
    DND: 'DND',
    OOS: 'OOO',
  };
  return getAllRooms(hkMap).map((r) => {
    const res = reservationForRoom(r.roomNo, reservations);
    const hk = hkMap[r.roomNo];
    return {
      id: r.id,
      roomNo: r.roomNo,
      floor: r.floor,
      type: r.typeCode,
      status: map[r.hkStatus],
      assignedTo: hk?.assignedTo,
      lastUpdated: PROPERTY.businessDate,
      guestName: res?.guestName,
      checkIn: res?.checkIn,
      checkOut: res?.checkOut,
      notes: hk?.notes ?? r.specialInfo,
    };
  });
}
