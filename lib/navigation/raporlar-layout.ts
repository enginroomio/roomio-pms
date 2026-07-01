import { RAPORLAR_MODULE_MENU } from './module-menus';

export const RAPORLAR_SIDE_TITLE = 'Raporlar';

export function raporlarBreadcrumb(...segments: string[]): string {
  return [RAPORLAR_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type RaporlarModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof RAPORLAR_MODULE_MENU;
  menuSearch: string;
};

export function raporlarModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): RaporlarModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: raporlarBreadcrumb(...breadcrumbSegments),
    sideTitle: RAPORLAR_SIDE_TITLE,
    menuItems: RAPORLAR_MODULE_MENU,
    menuSearch: normalized,
  };
}
