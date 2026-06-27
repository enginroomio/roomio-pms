export type RezListColumnId =
  | 'roomNo'
  | 'agency'
  | 'guest'
  | 'voucher'
  | 'refNo'
  | 'checkIn'
  | 'checkOut'
  | 'roomType'
  | 'mealPlan'
  | 'adults'
  | 'children'
  | 'infants'
  | 'roomCount'
  | 'nationality'
  | 'idNo'
  | 'createdBy'
  | 'status';

export const REZ_LIST_COLUMN_LABELS: Record<RezListColumnId, string> = {
  roomNo: 'Oda No',
  agency: 'Acenta',
  guest: 'Misafir',
  voucher: 'Voucher No',
  refNo: 'Rez No',
  checkIn: 'Giriş',
  checkOut: 'Çıkış',
  roomType: 'Tip',
  mealPlan: 'Pansiyon',
  adults: 'Kişi',
  children: 'Çocuk',
  infants: 'Bebek',
  roomCount: 'Oda',
  nationality: 'Uyruk',
  idNo: 'ID No',
  createdBy: 'Kayıt Yapan',
  status: 'Durum',
};

export const DEFAULT_REZ_LIST_COLUMNS: RezListColumnId[] = [
  'roomNo',
  'agency',
  'guest',
  'voucher',
  'refNo',
  'checkIn',
  'checkOut',
  'roomType',
  'mealPlan',
  'adults',
  'children',
  'infants',
  'roomCount',
  'nationality',
  'idNo',
  'createdBy',
  'status',
];

/** Ön büro odaklı — misafir ve tarih önde */
export const REZ_LIST_COLUMNS_FRONT_DESK: RezListColumnId[] = [
  'guest',
  'roomNo',
  'refNo',
  'agency',
  'checkIn',
  'checkOut',
  'status',
  'roomType',
  'mealPlan',
  'voucher',
  'adults',
  'children',
  'infants',
  'roomCount',
  'nationality',
  'idNo',
  'createdBy',
];

/** Operasyon — oda ve durum önde */
export const REZ_LIST_COLUMNS_OPS: RezListColumnId[] = [
  'roomNo',
  'status',
  'guest',
  'checkIn',
  'checkOut',
  'agency',
  'refNo',
  'voucher',
  'roomType',
  'mealPlan',
  'adults',
  'children',
  'infants',
  'roomCount',
  'nationality',
  'idNo',
  'createdBy',
];

/** Minimal — temel alanlar */
export const REZ_LIST_COLUMNS_MINIMAL: RezListColumnId[] = [
  'refNo',
  'guest',
  'checkIn',
  'checkOut',
  'roomNo',
  'agency',
  'mealPlan',
  'status',
];

const ALL_COLUMN_IDS = new Set<RezListColumnId>(DEFAULT_REZ_LIST_COLUMNS);

export const REZ_COLUMN_MIN_WIDTH = 28;
export const REZ_COLUMN_MAX_WIDTH = 360;

/** Elektra screen-039 benzeri varsayılan sütun genişlikleri (px). */
export const DEFAULT_REZ_COLUMN_WIDTHS: Record<RezListColumnId, number> = {
  roomNo: 54,
  agency: 132,
  guest: 152,
  voucher: 78,
  refNo: 68,
  checkIn: 76,
  checkOut: 76,
  roomType: 48,
  mealPlan: 52,
  adults: 38,
  children: 44,
  infants: 44,
  roomCount: 38,
  nationality: 52,
  idNo: 88,
  createdBy: 96,
  status: 84,
};

export function normalizeColumnWidths(
  raw?: Partial<Record<RezListColumnId, number>> | null,
): Record<RezListColumnId, number> {
  const result = { ...DEFAULT_REZ_COLUMN_WIDTHS };
  if (!raw) return result;
  for (const id of DEFAULT_REZ_LIST_COLUMNS) {
    const w = raw[id];
    if (typeof w === 'number' && Number.isFinite(w)) {
      result[id] = Math.min(REZ_COLUMN_MAX_WIDTH, Math.max(REZ_COLUMN_MIN_WIDTH, Math.round(w)));
    }
  }
  return result;
}

export function getColumnWidth(
  widths: Record<RezListColumnId, number>,
  columnId: RezListColumnId,
): number {
  return widths[columnId] ?? DEFAULT_REZ_COLUMN_WIDTHS[columnId];
}

export function tableWidthFromColumns(
  order: RezListColumnId[],
  widths: Record<RezListColumnId, number>,
): number {
  return order.reduce((sum, id) => sum + getColumnWidth(widths, id), 0);
}

export function resizeRezListColumn(
  widths: Record<RezListColumnId, number>,
  columnId: RezListColumnId,
  width: number,
): Record<RezListColumnId, number> {
  return {
    ...widths,
    [columnId]: Math.min(REZ_COLUMN_MAX_WIDTH, Math.max(REZ_COLUMN_MIN_WIDTH, Math.round(width))),
  };
}

export function reorderRezListColumn(
  order: RezListColumnId[],
  fromId: RezListColumnId,
  toId: RezListColumnId,
): RezListColumnId[] {
  if (fromId === toId) return order;
  const list = [...order];
  const fromIdx = list.indexOf(fromId);
  const toIdx = list.indexOf(toId);
  if (fromIdx < 0 || toIdx < 0) return list;
  list.splice(fromIdx, 1);
  list.splice(toIdx, 0, fromId);
  return list;
}

export function normalizeColumnOrder(raw?: RezListColumnId[] | null): RezListColumnId[] {
  const seen = new Set<RezListColumnId>();
  const order: RezListColumnId[] = [];
  for (const id of raw ?? []) {
    if (ALL_COLUMN_IDS.has(id) && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  for (const id of DEFAULT_REZ_LIST_COLUMNS) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}

export function moveRezListColumn(
  order: RezListColumnId[],
  columnId: RezListColumnId,
  direction: 'up' | 'down',
): RezListColumnId[] {
  const list = [...order];
  const idx = list.indexOf(columnId);
  if (idx < 0) return list;
  const next = direction === 'up' ? idx - 1 : idx + 1;
  if (next < 0 || next >= list.length) return list;
  [list[idx], list[next]] = [list[next], list[idx]];
  return list;
}
