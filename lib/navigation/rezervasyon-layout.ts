import { REZERVASYON_MODULE_MENU } from './module-menus';

export const REZERVASYON_SIDE_TITLE = 'Rezervasyon';

export function rezervasyonBreadcrumb(...segments: string[]): string {
  return [REZERVASYON_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type RezervasyonModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof REZERVASYON_MODULE_MENU;
  menuSearch: string;
};

export function rezervasyonModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): RezervasyonModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: rezervasyonBreadcrumb(...breadcrumbSegments),
    sideTitle: REZERVASYON_SIDE_TITLE,
    menuItems: REZERVASYON_MODULE_MENU,
    menuSearch: normalized,
  };
}
