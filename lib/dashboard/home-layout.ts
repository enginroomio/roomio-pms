export type HomePanelId =
  | 'welcome'
  | 'portfolio'
  | 'alerts'
  | 'quickActions'
  | 'kpiStrip'
  | 'rack';

export type HomeThemeId = 'modern' | 'glass' | 'compact' | 'elektra' | 'midnight' | 'orijinal';

export type HomePresetId =
  | 'ana-ekran'
  | 'modern-glass'
  | 'rack-focus'
  | 'executive'
  | 'ops-dense'
  | 'aurora'
  | 'orijinal-operasyon'
  | 'orijinal-kompakt'
  | 'orijinal-klasik';

export type HomeLayout = {
  presetId: HomePresetId | 'custom' | string;
  panelOrder: HomePanelId[];
  hiddenPanels: HomePanelId[];
  theme: HomeThemeId;
  rackExpanded: boolean;
  showKpiStrip: boolean;
};

export type HomePreset = {
  id: HomePresetId;
  label: string;
  description: string;
  preview: string;
  layout: Omit<HomeLayout, 'presetId'>;
};

export const HOME_PANEL_LABELS: Record<HomePanelId, string> = {
  welcome: 'Karşılama & günlük özet',
  portfolio: 'Çoklu şube özeti',
  alerts: 'Operasyon uyarıları',
  quickActions: 'Hızlı işlemler',
  kpiStrip: 'KPI şeridi',
  rack: 'Oda rack & hareketler',
};

export const HOME_THEME_LABELS: Record<HomeThemeId, string> = {
  modern: 'Modern (varsayılan)',
  glass: 'Cam / Glass',
  compact: 'Kompakt yoğun',
  elektra: 'Elektra klasik',
  midnight: 'Gece modu vurgusu',
  orijinal: 'Orijinal PMS (emerald)',
};

/** Kayıtlı ana ekran şablonu — Orijinal PMS operasyon varsayılanı */
export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  presetId: 'orijinal-operasyon',
  panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
  hiddenPanels: ['portfolio', 'kpiStrip'],
  theme: 'orijinal',
  rackExpanded: true,
  showKpiStrip: false,
};

export const HOME_PRESETS: HomePreset[] = [
  {
    id: 'ana-ekran',
    label: 'Ana Ekran Şablonu',
    description: 'Kayıtlı varsayılan — karşılama, şube, uyarılar, rack.',
    preview: 'modern',
    layout: {
      panelOrder: ['welcome', 'portfolio', 'alerts', 'quickActions', 'kpiStrip', 'rack'],
      hiddenPanels: [],
      theme: 'modern',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    id: 'modern-glass',
    label: 'Modern Glass',
    description: 'Yarı saydam kartlar, yumuşak gölgeler, ferah görünüm.',
    preview: 'glass',
    layout: {
      panelOrder: ['welcome', 'portfolio', 'quickActions', 'alerts', 'kpiStrip', 'rack'],
      hiddenPanels: [],
      theme: 'glass',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    id: 'rack-focus',
    label: 'Rack Odaklı',
    description: 'Oda rack öne çıkar; üst bantlar kompakt.',
    preview: 'compact',
    layout: {
      panelOrder: ['welcome', 'quickActions', 'rack', 'alerts', 'portfolio', 'kpiStrip'],
      hiddenPanels: [],
      theme: 'compact',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    id: 'executive',
    label: 'Yönetici Özeti',
    description: 'KPI ve şube öne çıkar; uyarılar sadeleştirilir.',
    preview: 'midnight',
    layout: {
      panelOrder: ['welcome', 'portfolio', 'kpiStrip', 'rack', 'quickActions', 'alerts'],
      hiddenPanels: [],
      theme: 'midnight',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    id: 'ops-dense',
    label: 'Operasyon Yoğun',
    description: 'Hızlı işlemler üstte, Elektra tarzı sıkı düzen.',
    preview: 'elektra',
    layout: {
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack', 'portfolio', 'kpiStrip'],
      hiddenPanels: [],
      theme: 'elektra',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    id: 'aurora',
    label: 'Aurora Analytics',
    description: 'Renkli KPI şeridi + geniş rack, analitik odak.',
    preview: 'aurora',
    layout: {
      panelOrder: ['welcome', 'kpiStrip', 'portfolio', 'rack', 'alerts', 'quickActions'],
      hiddenPanels: [],
      theme: 'glass',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    id: 'orijinal-operasyon',
    label: 'Orijinal · Operasyon',
    description: 'Tarayıcı mockup — hızlı işlemler, koyu özet bandı, rack + uyarılar.',
    preview: 'orijinal',
    layout: {
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    id: 'orijinal-kompakt',
    label: 'Orijinal · Kompakt',
    description: 'Orijinal düzen — sıkı boşluklar, operasyon uyarıları açık.',
    preview: 'orijinal',
    layout: {
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    id: 'orijinal-klasik',
    label: 'Orijinal · Klasik',
    description: 'Sade orijinal — yalnızca hızlı işlemler, özet ve oda rack.',
    preview: 'orijinal',
    layout: {
      panelOrder: ['quickActions', 'welcome', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip', 'alerts'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
];

const STORAGE_KEY = 'roomio:home-layout-v1';

const ALL_PANELS = Object.keys(HOME_PANEL_LABELS) as HomePanelId[];

/** Eski `ana-ekran` + modern tema kaydı — orijinal varsayılana taşınır. */
export function shouldMigrateToOrijinalLayout(raw: Partial<HomeLayout> | null | undefined): boolean {
  if (!raw) return true;
  return raw.presetId === 'ana-ekran' && (!raw.theme || raw.theme === 'modern');
}

export function normalizeHomeLayout(raw: Partial<HomeLayout> | null | undefined): HomeLayout {
  const base = { ...DEFAULT_HOME_LAYOUT, ...raw };
  const seen = new Set<HomePanelId>();
  const order: HomePanelId[] = [];
  for (const id of base.panelOrder ?? []) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  for (const id of ALL_PANELS) {
    if (!seen.has(id)) order.push(id);
  }
  const hidden = (base.hiddenPanels ?? []).filter((id) => ALL_PANELS.includes(id));
  const themes: HomeThemeId[] = ['modern', 'glass', 'compact', 'elektra', 'midnight', 'orijinal'];
  return {
    presetId: base.presetId ?? 'ana-ekran',
    panelOrder: order,
    hiddenPanels: hidden,
    theme: themes.includes(base.theme as HomeThemeId) ? (base.theme as HomeThemeId) : 'modern',
    rackExpanded: base.rackExpanded !== false,
    showKpiStrip: Boolean(base.showKpiStrip),
  };
}

export function loadHomeLayout(): HomeLayout {
  if (typeof window === 'undefined') return DEFAULT_HOME_LAYOUT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_LAYOUT;
    return normalizeHomeLayout(JSON.parse(raw) as Partial<HomeLayout>);
  } catch {
    return DEFAULT_HOME_LAYOUT;
  }
}

export function saveHomeLayout(layout: HomeLayout): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeHomeLayout(layout)));
}

export function applyHomePreset(presetId: HomePresetId): HomeLayout {
  const preset = HOME_PRESETS.find((p) => p.id === presetId);
  if (!preset) return DEFAULT_HOME_LAYOUT;
  return normalizeHomeLayout({ presetId, ...preset.layout });
}

export function applyHomeLayoutSnapshot(layout: HomeLayout, templateId?: string): HomeLayout {
  const layoutPreset = layout.presetId;
  const isKnownPreset = HOME_PRESETS.some((p) => p.id === layoutPreset);
  return normalizeHomeLayout({
    ...layout,
    presetId: isKnownPreset ? layoutPreset : templateId ?? layoutPreset ?? 'custom',
  });
}

export function resetHomeLayoutToTemplate(): HomeLayout {
  return normalizeHomeLayout(DEFAULT_HOME_LAYOUT);
}

export function reorderHomePanel(
  layout: HomeLayout,
  fromId: HomePanelId,
  toId: HomePanelId,
): HomeLayout {
  if (fromId === toId) return layout;
  const list = [...layout.panelOrder];
  const fromIdx = list.indexOf(fromId);
  if (fromIdx < 0) return layout;
  list.splice(fromIdx, 1);
  let toIdx = list.indexOf(toId);
  if (toIdx < 0) toIdx = list.length;
  list.splice(toIdx, 0, fromId);
  return normalizeHomeLayout({ ...layout, presetId: 'custom', panelOrder: list });
}

export function visibleHomePanels(layout: HomeLayout): HomePanelId[] {
  return layout.panelOrder.filter((id) => !layout.hiddenPanels.includes(id));
}
