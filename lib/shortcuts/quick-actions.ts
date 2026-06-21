import { flattenSidebarLinks } from '@/lib/navigation/sidebar-nav';

export type QuickActionCatalogItem = {
  id: string;
  label: string;
  href: string;
  category: string;
  icon: string;
  section: string;
};

export type UserQuickAction = {
  id: string;
  catalogId?: string;
  customLabel?: string;
  customHref?: string;
  key: string;
};

export type ResolvedQuickAction = {
  userId: string;
  label: string;
  href: string;
  key: string;
  icon: string;
  category: string;
  custom: boolean;
};

const STORAGE_KEY = 'roomio_quick_actions_v1';
export const QUICK_ACTION_MAX_ITEMS = 12;

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

function iconForHref(href: string, category: string): string {
  if (href === '/') return 'home';
  if (href.startsWith('/reservations')) return 'calendar';
  if (href.startsWith('/reception')) return 'wallet';
  if (href.startsWith('/rooms')) return 'bed';
  if (href.startsWith('/housekeeping')) return 'bed';
  if (href.startsWith('/guest-relations')) return 'heart';
  if (href.startsWith('/fnb')) return 'file';
  if (href.startsWith('/accounting')) return 'file';
  if (href.startsWith('/reports')) return 'file';
  if (href.startsWith('/settings') || href.startsWith('/tools')) return 'settings';
  if (href.includes('5651') || href.includes('hotspot')) return 'wifi';
  if (href.includes('tesa') || href.includes('integrations')) return 'shield';
  if (category.includes('GÜN SONU')) return 'calendar';
  return 'search';
}

function buildCatalog(): QuickActionCatalogItem[] {
  const links = flattenSidebarLinks();
  const seen = new Set<string>();
  const items: QuickActionCatalogItem[] = [];

  for (const link of links) {
    if (!link.href || link.href === '#') continue;
    const parts = link.label.split(' › ').map((p) => p.trim()).filter(Boolean);
    const section = parts[0] ?? 'GENEL';
    const label = parts[parts.length - 1] ?? link.label;
    const dedupeKey = `${link.href}|${label}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    items.push({
      id: slug(`${link.href}-${label}`),
      label,
      href: link.href,
      category: section,
      section,
      icon: iconForHref(link.href, section),
    });
  }

  return items.sort(
    (a, b) => a.category.localeCompare(b.category, 'tr') || a.label.localeCompare(b.label, 'tr'),
  );
}

export const QUICK_ACTION_CATALOG: QuickActionCatalogItem[] = buildCatalog();

export const QUICK_ACTION_CATEGORIES = [
  'all',
  ...Array.from(new Set(QUICK_ACTION_CATALOG.map((item) => item.category))).sort((a, b) =>
    a.localeCompare(b, 'tr'),
  ),
];

function pickCatalogId(href: string, labelHint?: string): string | undefined {
  const matches = QUICK_ACTION_CATALOG.filter((item) => item.href === href);
  if (labelHint) {
    const hint = labelHint.toLocaleLowerCase('tr-TR');
    const hit = matches.find((item) => item.label.toLocaleLowerCase('tr-TR').includes(hint));
    if (hit) return hit.id;
  }
  return matches[0]?.id;
}

export const DEFAULT_QUICK_ACTIONS: UserQuickAction[] = [
  { id: 'qa1', catalogId: pickCatalogId('/reservations/new', 'yeni rezervasyon'), key: 'F2' },
  { id: 'qa2', catalogId: pickCatalogId('/reception/inhouse', 'konaklayan'), key: 'F3' },
  { id: 'qa3', catalogId: pickCatalogId('/rooms', 'oda rack'), key: 'F12' },
  { id: 'qa4', catalogId: pickCatalogId('/reception', 'kasa'), key: 'F6' },
];

export function readQuickActions(): UserQuickAction[] {
  if (typeof window === 'undefined') return DEFAULT_QUICK_ACTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_QUICK_ACTIONS;
    const parsed = JSON.parse(raw) as UserQuickAction[];
    return parsed.length ? parsed : DEFAULT_QUICK_ACTIONS;
  } catch {
    return DEFAULT_QUICK_ACTIONS;
  }
}

export function saveQuickActions(items: UserQuickAction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, QUICK_ACTION_MAX_ITEMS)));
  window.dispatchEvent(new Event('roomio-quick-actions-changed'));
}

export function resolveQuickAction(item: UserQuickAction): ResolvedQuickAction | null {
  if (item.customHref && item.customLabel) {
    return {
      userId: item.id,
      label: item.customLabel,
      href: item.customHref,
      key: item.key,
      icon: 'search',
      category: 'Özel',
      custom: true,
    };
  }

  const catalog = QUICK_ACTION_CATALOG.find((entry) => entry.id === item.catalogId);
  if (!catalog) return null;

  return {
    userId: item.id,
    label: catalog.label,
    href: catalog.href,
    key: item.key,
    icon: catalog.icon,
    category: catalog.category,
    custom: false,
  };
}

export function resolvedQuickActions(): ResolvedQuickAction[] {
  return readQuickActions()
    .map((item) => resolveQuickAction(item))
    .filter(Boolean) as ResolvedQuickAction[];
}

export function quickActionKeyMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of resolvedQuickActions()) {
    if (!item.key) continue;
    map[item.key.toLowerCase()] = item.href;
  }
  return map;
}

export function catalogItemById(id: string): QuickActionCatalogItem | undefined {
  return QUICK_ACTION_CATALOG.find((item) => item.id === id);
}
