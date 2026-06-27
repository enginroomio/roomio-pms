import {
  DEFAULT_REZ_LIST_COLUMNS,
  normalizeColumnOrder,
  normalizeColumnWidths,
  REZ_LIST_COLUMNS_FRONT_DESK,
  REZ_LIST_COLUMNS_MINIMAL,
  REZ_LIST_COLUMNS_OPS,
  type RezListColumnId,
} from '@/lib/reservations/list-columns';

export type RezListPanelId =
  | 'statusTabs'
  | 'toolbar'
  | 'search'
  | 'filterToggles'
  | 'filterFields';

export type RezListPresetId = 'elektra' | 'compact' | 'filter-top' | 'minimal' | 'ops';

export type RezListDensity = 'dense' | 'comfortable';

export type RezListLayout = {
  presetId: RezListPresetId | 'custom' | string;
  aboveTable: RezListPanelId[];
  belowTable: RezListPanelId[];
  columnOrder: RezListColumnId[];
  columnWidths: Record<RezListColumnId, number>;
  density: RezListDensity;
  filtersDefaultOpen: boolean;
  showDateFilterDefault: boolean;
  showRoomFilterDefault: boolean;
};

export type RezListPreset = {
  id: RezListPresetId;
  label: string;
  description: string;
  layout: Omit<RezListLayout, 'presetId'>;
};

function presetLayout(
  partial: Omit<RezListLayout, 'presetId' | 'columnWidths'> & { columnWidths?: RezListLayout['columnWidths'] },
): Omit<RezListLayout, 'presetId'> {
  return {
    ...partial,
    columnWidths: partial.columnWidths ?? normalizeColumnWidths(),
  };
}

export const REZ_LIST_PANEL_LABELS: Record<RezListPanelId, string> = {
  statusTabs: 'Durum sekmeleri',
  toolbar: 'Araç çubuğu',
  search: 'Hızlı arama',
  filterToggles: 'Filtre seçenekleri',
  filterFields: 'Filtre alanları',
};

export const DEFAULT_REZ_LIST_LAYOUT: RezListLayout = {
  presetId: 'compact',
  aboveTable: ['toolbar', 'search', 'filterToggles', 'filterFields'],
  belowTable: ['statusTabs'],
  columnOrder: [...DEFAULT_REZ_LIST_COLUMNS],
  columnWidths: normalizeColumnWidths(),
  density: 'dense',
  filtersDefaultOpen: false,
  showDateFilterDefault: false,
  showRoomFilterDefault: false,
};

export const REZ_LIST_PRESETS: RezListPreset[] = [
  {
    id: 'elektra',
    label: 'Elektra Klasik',
    description: 'Standart sütun sırası, yoğun tablo.',
    layout: presetLayout({
      aboveTable: ['toolbar', 'search', 'filterToggles', 'filterFields'],
      belowTable: ['statusTabs'],
      columnOrder: [...DEFAULT_REZ_LIST_COLUMNS],
      density: 'dense',
      filtersDefaultOpen: false,
      showDateFilterDefault: false,
      showRoomFilterDefault: false,
    }),
  },
  {
    id: 'compact',
    label: 'Kompakt Modern',
    description: 'Varsayılan modern liste — maksimum satır alanı.',
    layout: presetLayout({
      aboveTable: ['toolbar', 'search', 'filterToggles', 'filterFields'],
      belowTable: ['statusTabs'],
      columnOrder: [...DEFAULT_REZ_LIST_COLUMNS],
      density: 'dense',
      filtersDefaultOpen: false,
      showDateFilterDefault: false,
      showRoomFilterDefault: false,
    }),
  },
  {
    id: 'filter-top',
    label: 'Filtre Üstte',
    description: 'Durum ve filtreler üstte, rahat satır.',
    layout: presetLayout({
      aboveTable: ['statusTabs', 'filterToggles', 'filterFields', 'toolbar', 'search'],
      belowTable: [],
      columnOrder: [...REZ_LIST_COLUMNS_FRONT_DESK],
      density: 'comfortable',
      filtersDefaultOpen: true,
      showDateFilterDefault: true,
      showRoomFilterDefault: true,
    }),
  },
  {
    id: 'minimal',
    label: 'Minimal Liste',
    description: 'Yalnızca temel sütunlar.',
    layout: presetLayout({
      aboveTable: ['search'],
      belowTable: ['statusTabs'],
      columnOrder: [...REZ_LIST_COLUMNS_MINIMAL],
      density: 'dense',
      filtersDefaultOpen: false,
      showDateFilterDefault: false,
      showRoomFilterDefault: false,
    }),
  },
  {
    id: 'ops',
    label: 'Operasyon',
    description: 'Oda ve durum önde — kat operasyonu.',
    layout: presetLayout({
      aboveTable: ['statusTabs', 'toolbar', 'search', 'filterToggles', 'filterFields'],
      belowTable: [],
      columnOrder: [...REZ_LIST_COLUMNS_OPS],
      density: 'dense',
      filtersDefaultOpen: true,
      showDateFilterDefault: false,
      showRoomFilterDefault: true,
    }),
  },
];

const STORAGE_KEY = 'roomio:rez-list-layout-v3';
const LEGACY_STORAGE_KEYS = ['roomio:rez-list-layout-v2', 'roomio:rez-list-layout-v1'];

function allPanelIds(layout: Pick<RezListLayout, 'aboveTable' | 'belowTable'>): RezListPanelId[] {
  return [...layout.aboveTable, ...layout.belowTable];
}

export function normalizeRezListLayout(raw: Partial<RezListLayout> | null | undefined): RezListLayout {
  const base = { ...DEFAULT_REZ_LIST_LAYOUT, ...raw };
  const seen = new Set<RezListPanelId>();
  const above: RezListPanelId[] = [];
  const below: RezListPanelId[] = [];

  for (const id of base.aboveTable) {
    if (!seen.has(id)) {
      seen.add(id);
      above.push(id);
    }
  }
  for (const id of base.belowTable) {
    if (!seen.has(id)) {
      seen.add(id);
      below.push(id);
    }
  }

  for (const id of Object.keys(REZ_LIST_PANEL_LABELS) as RezListPanelId[]) {
    if (!seen.has(id)) above.push(id);
  }

  return {
    presetId: base.presetId ?? 'custom',
    aboveTable: above,
    belowTable: below,
    columnOrder: normalizeColumnOrder(base.columnOrder),
    columnWidths: normalizeColumnWidths(base.columnWidths),
    density: base.density === 'comfortable' ? 'comfortable' : 'dense',
    filtersDefaultOpen: Boolean(base.filtersDefaultOpen),
    showDateFilterDefault: Boolean(base.showDateFilterDefault),
    showRoomFilterDefault: Boolean(base.showRoomFilterDefault),
  };
}

export function loadRezListLayout(): RezListLayout {
  if (typeof window === 'undefined') return DEFAULT_REZ_LIST_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeRezListLayout(JSON.parse(raw) as Partial<RezListLayout>);

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        const migrated = normalizeRezListLayout(JSON.parse(legacy) as Partial<RezListLayout>);
        saveRezListLayout(migrated);
        return migrated;
      }
    }
    return DEFAULT_REZ_LIST_LAYOUT;
  } catch {
    return DEFAULT_REZ_LIST_LAYOUT;
  }
}

export function saveRezListLayout(layout: RezListLayout): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeRezListLayout(layout)));
}

export function applyRezListPreset(presetId: RezListPresetId): RezListLayout {
  const preset = REZ_LIST_PRESETS.find((p) => p.id === presetId);
  if (!preset) return DEFAULT_REZ_LIST_LAYOUT;
  return normalizeRezListLayout({ presetId, ...preset.layout });
}

export function applyRezListLayoutSnapshot(layout: RezListLayout, templateId?: string): RezListLayout {
  return normalizeRezListLayout({
    ...layout,
    presetId: templateId ?? layout.presetId ?? 'custom',
  });
}

export function reorderRezListPanel(
  layout: RezListLayout,
  zone: 'aboveTable' | 'belowTable',
  fromId: RezListPanelId,
  toId: RezListPanelId,
): RezListLayout {
  if (fromId === toId) return layout;
  const list = [...layout[zone]];
  const fromIdx = list.indexOf(fromId);
  if (fromIdx < 0) return layout;
  list.splice(fromIdx, 1);
  let toIdx = list.indexOf(toId);
  if (toIdx < 0) toIdx = list.length;
  list.splice(toIdx, 0, fromId);
  return normalizeRezListLayout({
    ...layout,
    presetId: 'custom',
    [zone]: list,
  });
}

export function moveRezListPanelToZone(
  layout: RezListLayout,
  panelId: RezListPanelId,
  targetZone: 'aboveTable' | 'belowTable',
  beforeId?: RezListPanelId,
): RezListLayout {
  const above = layout.aboveTable.filter((id) => id !== panelId);
  const below = layout.belowTable.filter((id) => id !== panelId);
  const target = targetZone === 'aboveTable' ? above : below;
  if (beforeId && target.includes(beforeId)) {
    const idx = target.indexOf(beforeId);
    target.splice(idx, 0, panelId);
  } else {
    target.push(panelId);
  }
  return normalizeRezListLayout({
    ...layout,
    presetId: 'custom',
    aboveTable: targetZone === 'aboveTable' ? target : above,
    belowTable: targetZone === 'belowTable' ? target : below,
  });
}

export { moveRezListColumn, reorderRezListColumn, resizeRezListColumn, normalizeColumnWidths, DEFAULT_REZ_COLUMN_WIDTHS } from '@/lib/reservations/list-columns';
