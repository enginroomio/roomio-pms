import { KAT_MODULE_MENU } from './module-menus';

export const KAT_SIDE_TITLE = 'Kat Hizmetleri';

export function katBreadcrumb(...segments: string[]): string {
  return [KAT_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type KatModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof KAT_MODULE_MENU;
  menuSearch: string;
};

export function katModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): KatModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: katBreadcrumb(...breadcrumbSegments),
    sideTitle: KAT_SIDE_TITLE,
    menuItems: KAT_MODULE_MENU,
    menuSearch: normalized,
  };
}
