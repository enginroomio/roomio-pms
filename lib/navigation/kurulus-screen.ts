import { normalizeKurulusSection } from './menu-route-params';

/** Kuruluş ?section= / ?tab= → panel anahtarı */
export function resolveKurulusScreenKey(section: string | null, tab: string | null): string {
  const sec = normalizeKurulusSection(section);
  if (tab === 'theme') return 'theme';
  if (tab === 'password') return 'password';
  if (tab === 'room-types') return 'room-types';
  if (tab === 'rooms') return 'rooms';
  if (tab === 'floors') return 'floors';
  if (sec) return sec;
  return 'otel-bilgileri';
}

/** Placeholder yerine gerçek panel dönen ekranlar */
export const KURULUS_IMPLEMENTED_SCREEN_KEYS = new Set([
  'password',
  'theme',
  'otel-bilgileri',
  'room-types',
  'rooms',
  'floors',
  'users',
  'user-groups',
  'markets',
  'segments',
  'sources',
  'departments',
  'currencies',
  'tax-rules',
  'nationalities',
  'language',
  'meal-plans',
  'company-list',
  'config',
  'program-date',
  'rate-plans',
  'agencies',
  'revenue-groups',
  'meal-prices',
  'seasons',
  'open-close',
  'branches',
  'warehouse',
  'inventory',
  'fiscal',
  'res-types',
  'extras',
  'demo-data',
  'market-required',
  'company-default',
  'company-select',
  'company-create',
  'user-params',
  'pbx-calls',
  'pbx-lookup',
  'sync',
  'lang-forms',
  'lang-menus',
  'lang-reports',
]);

export function isKurulusScreenImplemented(section: string | null, tab: string | null): boolean {
  return KURULUS_IMPLEMENTED_SCREEN_KEYS.has(resolveKurulusScreenKey(section, tab));
}

/** Menü href'inden section / tab çıkarır */
export function kurulusParamsFromHref(href: string): { section: string | null; tab: string | null } {
  if (!href.startsWith('/settings')) return { section: null, tab: null };
  const q = href.includes('?') ? href.split('?')[1] : '';
  const params = new URLSearchParams(q);
  return {
    section: params.get('section'),
    tab: params.get('tab'),
  };
}
