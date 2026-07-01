import { GUNSONU_MODULE_MENU } from './module-menus';

export const GUNSONU_SIDE_TITLE = 'Gün Sonu';

export function gunsonuBreadcrumb(...segments: string[]): string {
  return [GUNSONU_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type GunSonuModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof GUNSONU_MODULE_MENU;
  menuSearch: string;
};

export function gunsonuModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): GunSonuModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: gunsonuBreadcrumb(...breadcrumbSegments),
    sideTitle: GUNSONU_SIDE_TITLE,
    menuItems: GUNSONU_MODULE_MENU,
    menuSearch: normalized,
  };
}
