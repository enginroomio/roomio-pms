import { KURULUS_NAV, type KurulusNavEntry } from '@/lib/navigation/kurulus-nav';
import type { ModuleNavItem } from '@/lib/navigation/module-menus';
import type { SidebarNavItem } from '@/lib/navigation/sidebar-nav';

type TFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

const EXTRA_SECTION_KEYS: Record<string, string> = {
  language: 'nav.kurulus.language',
  'rate-plans': 'nav.kontrat.rate-plans',
  agencies: 'nav.kontrat.agencies',
  extras: 'nav.kontrat.extras',
};

export function kurulusNavLabel(t: TFn, entry: { id: string; label: string; separator?: boolean }): string {
  if (entry.separator) return '';
  return t(`nav.kurulus.${entry.id}`, undefined, entry.label);
}

export function translateKurulusModuleMenu(items: ModuleNavItem[], t: TFn): ModuleNavItem[] {
  return items.map((item) => ({
    ...item,
    label: item.separator ? '' : kurulusNavLabel(t, item),
    children: item.children?.length ? translateKurulusModuleMenu(item.children, t) : undefined,
  }));
}

function walkNav(entries: KurulusNavEntry[], href: string): KurulusNavEntry | undefined {
  for (const entry of entries) {
    if (entry.href === href) return entry;
    for (const child of entry.children ?? []) {
      if (child.href === href) return child;
    }
  }
  return undefined;
}

export function findKurulusNavTitle(t: TFn, section: string | null, tab: string | null): string {
  if (section && EXTRA_SECTION_KEYS[section]) {
    return t(EXTRA_SECTION_KEYS[section]);
  }
  const href = section ? `/settings?section=${section}` : tab ? `/settings?tab=${tab}` : '/settings';
  const match = walkNav(KURULUS_NAV, href);
  if (match) return kurulusNavLabel(t, match);
  return t('nav.kurulus.otel-bilgileri');
}

export function findKurulusScreenTitle(t: TFn, key: string): string {
  if (EXTRA_SECTION_KEYS[key]) return t(EXTRA_SECTION_KEYS[key]);
  for (const entry of KURULUS_NAV) {
    if (entry.id === key) return kurulusNavLabel(t, entry);
    for (const child of entry.children ?? []) {
      if (child.id === key) return kurulusNavLabel(t, child);
    }
  }
  return t(`nav.kurulus.${key}`, undefined, key);
}

export function translateSidebarNavItems(items: SidebarNavItem[], t: TFn): SidebarNavItem[] {
  return items.map((item) => ({
    ...item,
    label: item.separator ? '' : item.i18nKey ? t(item.i18nKey, undefined, item.label) : item.label,
    children: item.children?.length ? translateSidebarNavItems(item.children, t) : undefined,
  }));
}
