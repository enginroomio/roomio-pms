import { SISTEM_MODULE_MENU } from './module-menus';

export const SISTEM_SIDE_TITLE = 'Sistem';
export const SISTEM_BREADCRUMB_ROOT = 'Sistem';

/** Breadcrumb: `Sistem › Alt başlık` */
export function sistemBreadcrumb(...segments: string[]): string {
  return [SISTEM_BREADCRUMB_ROOT, ...segments.filter(Boolean)].join(' › ');
}

export type SistemModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof SISTEM_MODULE_MENU;
  menuSearch: string;
};

/** SİSTEM modülü yan menüsü — ModuleLayout ile birlikte kullanın */
export function sistemModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): SistemModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: sistemBreadcrumb(...breadcrumbSegments),
    sideTitle: SISTEM_SIDE_TITLE,
    menuItems: SISTEM_MODULE_MENU,
    menuSearch: normalized,
  };
}
