export type HkControlRecord = {
  id: string;
  roomNo: string;
  inspector: string;
  checkedAt: string;
  result: 'pass' | 'fail';
  notes?: string;
  itemsChecked: string[];
};

const STORAGE_KEY = 'roomio:hk-control-archive-v1';

const DEFAULT_ITEMS = [
  'Banyo temizliği',
  'Yatak düzeni',
  'Minibar kontrol',
  'Amenity set',
  'Halı / zemin',
];

export function defaultChecklistItems(): string[] {
  return [...DEFAULT_ITEMS];
}

export function loadControlArchive(): HkControlRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HkControlRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveControlRecord(record: HkControlRecord): void {
  const prev = loadControlArchive();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...prev].slice(0, 200)));
}
