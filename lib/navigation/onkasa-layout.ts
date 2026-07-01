import { ONKASA_MODULE_MENU } from './module-menus';

export const ONKASA_SIDE_TITLE = 'Ön Kasa';

export function onkasaBreadcrumb(...segments: string[]): string {
  return [ONKASA_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type OnKasaModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof ONKASA_MODULE_MENU;
  menuSearch: string;
};

export function onkasaModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): OnKasaModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: onkasaBreadcrumb(...breadcrumbSegments),
    sideTitle: ONKASA_SIDE_TITLE,
    menuItems: ONKASA_MODULE_MENU,
    menuSearch: normalized,
  };
}
