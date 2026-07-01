import { KURULUS_NAV, type KurulusNavEntry } from '@/lib/navigation/kurulus-nav';
import type { ModuleNavItem } from '@/lib/navigation/module-menus';
import type { SidebarNavItem } from '@/lib/navigation/sidebar-nav';
import { sidebarHrefI18nKey } from '@/lib/i18n/sidebar-href-i18n';
import { normalizeKurulusSection } from '@/lib/navigation/menu-route-params';

type TFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

const EXTRA_SECTION_KEYS: Record<string, string> = {
  language: 'nav.kurulus.language',
  'lang-forms': 'sidebar.sub.langForms',
  'lang-menus': 'sidebar.sub.langMenus',
  'lang-reports': 'sidebar.sub.langReports',
  nationalities: 'nav.kurulus.nationalities',
  'rate-plans': 'nav.kontrat.rate-plans',
  agencies: 'nav.kontrat.agencies',
  extras: 'nav.kontrat.extras',
  inventory: 'nav.kurulus.inventory',
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
  const normalizedSection = section ? normalizeKurulusSection(section) : null;
  if (normalizedSection && EXTRA_SECTION_KEYS[normalizedSection]) {
    return t(EXTRA_SECTION_KEYS[normalizedSection]);
  }
  const href = normalizedSection
    ? `/settings?section=${normalizedSection}`
    : tab
      ? `/settings?tab=${tab}`
      : '/settings';
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

function sidebarItemLabel(t: TFn, item: { label: string; i18nKey?: string; href?: string }): string {
  const key = item.i18nKey ?? (item.href ? sidebarHrefI18nKey(item.href) : undefined);
  return key ? t(key, undefined, item.label) : item.label;
}

export function translateSidebarNavItems(items: SidebarNavItem[], t: TFn): SidebarNavItem[] {
  return items.map((item) => ({
    ...item,
    label: item.separator ? '' : sidebarItemLabel(t, item),
    children: item.children?.length ? translateSidebarNavItems(item.children, t) : undefined,
  }));
}

function resolveFlatItemLabel(
  itemLabel: string,
  link: { i18nKey?: string; href: string },
  t: TFn,
): string {
  const key = link.i18nKey ?? sidebarHrefI18nKey(link.href);
  return key ? t(key, undefined, itemLabel) : itemLabel;
}

export function translateFlatSidebarLink(
  link: { label: string; href: string; i18nKey?: string; prefixKey?: string },
  t: TFn,
): { label: string; href: string } {
  const parts = link.label.split(' › ');
  const itemLabel = parts[parts.length - 1] ?? link.label;
  const itemTranslated = resolveFlatItemLabel(itemLabel, link, t);
  if (parts.length <= 1) return { label: itemTranslated, href: link.href };
  const prefix = link.prefixKey ? t(link.prefixKey, undefined, parts[0]) : parts[0];
  const middle = parts.slice(1, -1).join(' › ');
  const label = middle ? `${prefix} › ${middle} › ${itemTranslated}` : `${prefix} › ${itemTranslated}`;
  return { label, href: link.href };
}
