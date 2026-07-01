import { ARKABURO_MODULE_MENU } from './module-menus';

export const ARKABURO_SIDE_TITLE = 'Arka Büro';

export function arkaburoBreadcrumb(...segments: string[]): string {
  return [ARKABURO_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type ArkaBuroModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof ARKABURO_MODULE_MENU;
  menuSearch: string;
};

export function arkaburoModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): ArkaBuroModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: arkaburoBreadcrumb(...breadcrumbSegments),
    sideTitle: ARKABURO_SIDE_TITLE,
    menuItems: ARKABURO_MODULE_MENU,
    menuSearch: normalized,
  };
}
