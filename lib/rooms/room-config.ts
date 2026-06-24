/** Hotel Sapphire oda planı (77 oda) */
export const FLOORS = [
  { floor: 1, start: 101, end: 118 },
  { floor: 2, start: 201, end: 218 },
  { floor: 3, start: 301, end: 318 },
  { floor: 4, start: 401, end: 418 },
  { floor: 5, start: 501, end: 510 },
] as const;

export type FloorRange = { floor: number; start: number; end: number };

let floorsOverride: FloorRange[] | null = null;

export function setFloorsOverride(floors: FloorRange[]) {
  floorsOverride = floors.length > 0 ? floors : null;
}

export function getActiveFloors(): readonly FloorRange[] {
  return floorsOverride ?? FLOORS;
}

/** Panoda gösterilmeyen odalar (×06) */
export const EXCLUDED_SUFFIXES = [6];

export function isRoomExcluded(num: number | string): boolean {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  return EXCLUDED_SUFFIXES.includes(n % 100);
}

export function countTotalRooms(): number {
  return getActiveFloors().reduce((sum, f) => {
    let count = 0;
    for (let num = f.start; num <= f.end; num++) {
      if (!isRoomExcluded(num)) count++;
    }
    return sum + count;
  }, 0);
}

export function floorFromRoomNo(roomNo: string): number {
  return Math.floor(parseInt(roomNo, 10) / 100);
}

export function allRoomNumbers(): string[] {
  const out: string[] = [];
  for (const { start, end } of getActiveFloors()) {
    for (let num = start; num <= end; num++) {
      if (!isRoomExcluded(num)) out.push(String(num));
    }
  }
  return out;
}
