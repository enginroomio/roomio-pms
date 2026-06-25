'use client';

import { RACK_FLOOR_COLORS } from '@/lib/client/rack-display-actions';
import type { RackCell } from '@/lib/types/room';

export type RackViewMode = 'roomNo' | 'type';

export type RackPreferences = {
  floorBg: string;
  previewDetail: boolean;
  viewMode: RackViewMode;
  dragDrop: boolean;
  fixPositions: boolean;
  /** Kat anahtarı → oda no sırası */
  cellOrder: Record<string, string[]>;
};

const STORAGE_KEY = 'roomio-rack-prefs';

export const DEFAULT_RACK_PREFERENCES: RackPreferences = {
  floorBg: RACK_FLOOR_COLORS[0],
  previewDetail: true,
  viewMode: 'roomNo',
  dragDrop: false,
  fixPositions: false,
  cellOrder: {},
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeRackPreferences(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRackPreferences(): RackPreferences {
  if (typeof window === 'undefined') return DEFAULT_RACK_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RACK_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<RackPreferences>;
    return {
      ...DEFAULT_RACK_PREFERENCES,
      ...parsed,
      cellOrder: parsed.cellOrder ?? {},
    };
  } catch {
    return DEFAULT_RACK_PREFERENCES;
  }
}

export function updateRackPreferences(patch: Partial<RackPreferences>) {
  const next = { ...getRackPreferences(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
  return next;
}

export function rackFloorKey(floor: number | 'all'): string {
  return floor === 'all' ? 'all' : String(floor);
}

export function sortRackCells(cells: RackCell[], order?: string[]): RackCell[] {
  if (!order?.length) return cells;
  const map = new Map(cells.map((c) => [c.room.roomNo, c]));
  const sorted: RackCell[] = [];
  for (const roomNo of order) {
    const cell = map.get(roomNo);
    if (cell) {
      sorted.push(cell);
      map.delete(roomNo);
    }
  }
  for (const cell of map.values()) sorted.push(cell);
  return sorted;
}

export function reorderRackCells(
  order: string[],
  fromRoomNo: string,
  toRoomNo: string,
): string[] {
  if (fromRoomNo === toRoomNo) return order;
  const base = [...order];
  const fromIdx = base.indexOf(fromRoomNo);
  if (fromIdx >= 0) base.splice(fromIdx, 1);
  let toIdx = base.indexOf(toRoomNo);
  if (toIdx < 0) toIdx = base.length;
  base.splice(toIdx, 0, fromRoomNo);
  return base;
}
