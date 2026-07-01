import { AYARLAR_MODULE_MENU } from './module-menus';

export const AYARLAR_SIDE_TITLE = 'Ayarlar';

export function ayarlarBreadcrumb(...segments: string[]): string {
  return [AYARLAR_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type AyarlarModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof AYARLAR_MODULE_MENU;
  menuSearch: string;
};

export function ayarlarModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): AyarlarModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: ayarlarBreadcrumb(...breadcrumbSegments),
    sideTitle: AYARLAR_SIDE_TITLE,
    menuItems: AYARLAR_MODULE_MENU,
    menuSearch: normalized,
  };
}
