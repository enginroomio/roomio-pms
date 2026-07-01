import { RESEPSIYON_MODULE_MENU } from './module-menus';

export const RESEPSIYON_SIDE_TITLE = 'Resepsiyon';

export function resepsiyonBreadcrumb(...segments: string[]): string {
  return [RESEPSIYON_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type ResepsiyonModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof RESEPSIYON_MODULE_MENU;
  menuSearch: string;
};

export function resepsiyonModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): ResepsiyonModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: resepsiyonBreadcrumb(...breadcrumbSegments),
    sideTitle: RESEPSIYON_SIDE_TITLE,
    menuItems: RESEPSIYON_MODULE_MENU,
    menuSearch: normalized,
  };
}
