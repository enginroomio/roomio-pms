import { MISAFIR_MODULE_MENU } from './module-menus';

export const MISAFIR_SIDE_TITLE = 'Misafir İlişkileri';

export function misafirBreadcrumb(...segments: string[]): string {
  return [MISAFIR_SIDE_TITLE, ...segments.filter(Boolean)].join(' › ');
}

export type MisafirModuleLayoutDefaults = {
  breadcrumb: string;
  sideTitle: string;
  menuItems: typeof MISAFIR_MODULE_MENU;
  menuSearch: string;
};

export function misafirModuleLayoutDefaults(
  menuSearch: string,
  ...breadcrumbSegments: string[]
): MisafirModuleLayoutDefaults {
  const normalized = menuSearch.startsWith('?') || !menuSearch ? menuSearch : `?${menuSearch}`;
  return {
    breadcrumb: misafirBreadcrumb(...breadcrumbSegments),
    sideTitle: MISAFIR_SIDE_TITLE,
    menuItems: MISAFIR_MODULE_MENU,
    menuSearch: normalized,
  };
}
