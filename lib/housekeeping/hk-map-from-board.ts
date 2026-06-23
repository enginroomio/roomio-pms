import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { RoomHkStatus } from '@/lib/types/room';

export function hkMapFromBoardRows(rows: HousekeepingBoardRow[]): Record<string, HkRoomRecord> {
  const map: Record<string, HkRoomRecord> = {};
  for (const row of rows) {
    map[row.roomNo] = {
      hkStatus: row.status as RoomHkStatus,
      assignedTo: row.assignedTo,
      notes: row.notes,
    };
  }
  return map;
}

export function mergeHkMaps(
  base: Record<string, HkRoomRecord>,
  patch: Record<string, HkRoomRecord>,
): Record<string, HkRoomRecord> {
  const next = { ...base };
  for (const [roomNo, record] of Object.entries(patch)) {
    next[roomNo] = { ...next[roomNo], ...record };
  }
  return next;
}
