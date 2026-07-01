import { BANKET_MODULE_MENU } from './module-menus';

export const BANKET_SIDE_TITLE = 'Banket';

export function banketBreadcrumb(...segments: string[]): string {
  return [BANKET_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type BanketModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof BANKET_MODULE_MENU;
  menuSearch: string;
};

export function banketModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): BanketModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: banketBreadcrumb(...breadcrumbSegments),
    sideTitle: BANKET_SIDE_TITLE,
    menuItems: BANKET_MODULE_MENU,
    menuSearch: normalized,
  };
}
