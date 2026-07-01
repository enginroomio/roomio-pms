import type { HomeLayout } from '@/lib/dashboard/home-layout';
import {
  DEFAULT_HOME_LAYOUT,
  loadHomeLayout,
  normalizeHomeLayout,
  saveHomeLayout,
  shouldMigrateToOrijinalLayout,
} from '@/lib/dashboard/home-layout';

export type HomeUserTemplate = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  layout: HomeLayout;
};

const ARCHIVE_KEY = 'roomio:home-archive-v1';
const DEFAULT_TEMPLATE_KEY = 'roomio:home-default-template-id';
const ARCHIVE_VERSION_KEY = 'roomio:home-archive-version';
const LAYOUT_MIGRATION_KEY = 'roomio:home-layout-migration-v';
const LAYOUT_MIGRATION_VERSION = 1;
const ARCHIVE_VERSION = 3;

/** Ana ekran dizayn arşivi — hazır şablonlar (orijinal mockup dahil) */
export const BUILTIN_HOME_ARCHIVE: Omit<HomeUserTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Ana Ekran Klasik',
    description: 'Kayıtlı varsayılan — karşılama, çoklu şube, uyarılar ve geniş oda rack.',
    layout: {
      presetId: 'ana-ekran',
      panelOrder: ['welcome', 'portfolio', 'alerts', 'quickActions', 'kpiStrip', 'rack'],
      hiddenPanels: [],
      theme: 'modern',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Modern Glass Lounge',
    description: 'Yarı saydam cam kartlar, yumuşak gölgeler ve her zaman görünür KPI şeridi.',
    layout: {
      presetId: 'modern-glass',
      panelOrder: ['welcome', 'portfolio', 'quickActions', 'alerts', 'kpiStrip', 'rack'],
      hiddenPanels: [],
      theme: 'glass',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    name: 'Rack Komuta Merkezi',
    description: 'Oda rack öne çıkar; üst bantlar kompakt, yoğun operasyon düzeni.',
    layout: {
      presetId: 'rack-focus',
      panelOrder: ['welcome', 'quickActions', 'rack', 'alerts', 'portfolio', 'kpiStrip'],
      hiddenPanels: [],
      theme: 'compact',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Yönetici Panosu',
    description: 'KPI ve çoklu şube öne çıkar; gece modu vurgusu ile yönetici özeti.',
    layout: {
      presetId: 'executive',
      panelOrder: ['welcome', 'portfolio', 'kpiStrip', 'rack', 'quickActions', 'alerts'],
      hiddenPanels: [],
      theme: 'midnight',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    name: 'Operasyon Yoğun Vardiya',
    description: 'Hızlı işlemler en üstte; Elektra tarzı sıkı, yoğun resepsiyon düzeni.',
    layout: {
      presetId: 'ops-dense',
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack', 'portfolio', 'kpiStrip'],
      hiddenPanels: [],
      theme: 'elektra',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Aurora Analitik',
    description: 'Renkli KPI şeridi ve geniş rack; doluluk ve gelir analitiği odaklı.',
    layout: {
      presetId: 'aurora',
      panelOrder: ['welcome', 'kpiStrip', 'portfolio', 'rack', 'alerts', 'quickActions'],
      hiddenPanels: [],
      theme: 'glass',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    name: 'Resepsiyon Hızlı Geçiş',
    description: 'Ön büro odaklı — hızlı işlemler ve uyarılar önde, şube paneli gizli.',
    layout: {
      presetId: 'builtin-reception',
      panelOrder: ['quickActions', 'welcome', 'alerts', 'kpiStrip', 'rack'],
      hiddenPanels: ['portfolio'],
      theme: 'glass',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    name: 'Çoklu Tesis Komutanlığı',
    description: 'Zincir otel yönetimi — şube özeti ve KPI öncelikli, hızlı işlemler gizli.',
    layout: {
      presetId: 'builtin-multi-property',
      panelOrder: ['portfolio', 'kpiStrip', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['quickActions'],
      theme: 'modern',
      rackExpanded: true,
      showKpiStrip: true,
    },
  },
  {
    name: 'Minimal Odak',
    description: 'Yalnızca günlük özet ve oda rack — dikkat dağıtıcı paneller kapalı.',
    layout: {
      presetId: 'builtin-minimal',
      panelOrder: ['welcome', 'rack'],
      hiddenPanels: ['portfolio', 'alerts', 'quickActions', 'kpiStrip'],
      theme: 'compact',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Gece Vardiyası',
    description: 'Gece operasyonu — uyarılar ve hızlı işlemler önce, koyu tema vurgusu.',
    layout: {
      presetId: 'builtin-night-shift',
      panelOrder: ['alerts', 'quickActions', 'welcome', 'rack', 'kpiStrip'],
      hiddenPanels: ['portfolio'],
      theme: 'midnight',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Orijinal · Operasyon Paneli',
    description:
      'Otel PMS orijinal mockup — emerald hızlı işlemler, koyu karşılama bandı, geniş rack ve operasyon uyarıları.',
    layout: {
      presetId: 'orijinal-operasyon',
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Orijinal · Kompakt',
    description: 'Orijinal düzenin sıkı varyantı — operasyon uyarıları açık, şube/KPI gizli.',
    layout: {
      presetId: 'orijinal-kompakt',
      panelOrder: ['quickActions', 'welcome', 'alerts', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
  {
    name: 'Orijinal · Klasik',
    description: 'En sade orijinal görünüm — hızlı işlemler, günlük özet ve oda rack.',
    layout: {
      presetId: 'orijinal-klasik',
      panelOrder: ['quickActions', 'welcome', 'rack'],
      hiddenPanels: ['portfolio', 'kpiStrip', 'alerts'],
      theme: 'orijinal',
      rackExpanded: true,
      showKpiStrip: false,
    },
  },
];

function seedArchive(): HomeUserTemplate[] {
  const now = new Date().toISOString();
  return BUILTIN_HOME_ARCHIVE.map((item, i) => ({
    ...item,
    id: `builtin-${i}`,
    createdAt: now,
    layout: normalizeHomeLayout(item.layout),
  }));
}

function readArchiveVersion(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(ARCHIVE_VERSION_KEY);
  return raw ? Number(raw) || 0 : 0;
}

function writeArchiveVersion(version: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARCHIVE_VERSION_KEY, String(version));
}

export function migrateHomeLayoutForOrijinalDefault(): HomeLayout {
  if (typeof window === 'undefined') return DEFAULT_HOME_LAYOUT;

  const migrated = Number(localStorage.getItem(LAYOUT_MIGRATION_KEY) || 0);
  if (migrated >= LAYOUT_MIGRATION_VERSION) return loadHomeLayout();

  localStorage.setItem(LAYOUT_MIGRATION_KEY, String(LAYOUT_MIGRATION_VERSION));

  let raw: Partial<HomeLayout> | null = null;
  try {
    const stored = localStorage.getItem('roomio:home-layout-v1');
    raw = stored ? (JSON.parse(stored) as Partial<HomeLayout>) : null;
  } catch {
    raw = null;
  }

  if (!shouldMigrateToOrijinalLayout(raw)) return loadHomeLayout();

  const next = normalizeHomeLayout(DEFAULT_HOME_LAYOUT);
  saveHomeLayout(next);
  if (!getDefaultHomeTemplateId()) {
    const builtinId = getBuiltinTemplateIdByPreset('orijinal-operasyon');
    if (builtinId) setDefaultHomeTemplateId(builtinId);
  }
  return next;
}

export function loadHomeArchive(): HomeUserTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const version = readArchiveVersion();
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw || version < ARCHIVE_VERSION) {
      const userTemplates = raw
        ? (JSON.parse(raw) as HomeUserTemplate[]).filter((t) => !t.id.startsWith('builtin-'))
        : [];
      const seeded = seedArchive();
      const merged = [...seeded, ...userTemplates];
      saveHomeArchive(merged);
      writeArchiveVersion(ARCHIVE_VERSION);
      return merged;
    }
    const parsed = JSON.parse(raw) as HomeUserTemplate[];
    return parsed.map((t) => ({
      ...t,
      layout: normalizeHomeLayout(t.layout),
    }));
  } catch {
    const seeded = seedArchive();
    saveHomeArchive(seeded);
    writeArchiveVersion(ARCHIVE_VERSION);
    return seeded;
  }
}

export function saveHomeArchive(templates: HomeUserTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(templates));
}

export function addHomeTemplate(
  name: string,
  layout: HomeLayout,
  description?: string,
): HomeUserTemplate {
  const archive = loadHomeArchive();
  const entry: HomeUserTemplate = {
    id: `tpl-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    layout: normalizeHomeLayout(layout),
  };
  saveHomeArchive([entry, ...archive]);
  return entry;
}

export function deleteHomeTemplate(id: string): HomeUserTemplate[] {
  const next = loadHomeArchive().filter((t) => t.id !== id);
  saveHomeArchive(next.length ? next : seedArchive());
  if (getDefaultHomeTemplateId() === id) setDefaultHomeTemplateId(null);
  return loadHomeArchive();
}

export function getDefaultHomeTemplateId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEFAULT_TEMPLATE_KEY);
}

export function setDefaultHomeTemplateId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(DEFAULT_TEMPLATE_KEY, id);
  else localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
}

export function findHomeTemplate(id: string): HomeUserTemplate | undefined {
  return loadHomeArchive().find((t) => t.id === id);
}

export function getBuiltinTemplateIdByPreset(presetId: string): string | undefined {
  const idx = BUILTIN_HOME_ARCHIVE.findIndex((t) => t.layout.presetId === presetId);
  if (idx < 0) return undefined;
  return `builtin-${idx}`;
}

export function getBuiltinHomeTemplateName(id: string): string | undefined {
  const idx = Number(id.replace('builtin-', ''));
  if (!Number.isFinite(idx) || idx < 0 || idx >= BUILTIN_HOME_ARCHIVE.length) return undefined;
  return BUILTIN_HOME_ARCHIVE[idx]?.name;
}

export { DEFAULT_HOME_LAYOUT };
