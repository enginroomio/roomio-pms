/** Sistem › Dil Tanımları alt ekranları */
export const DIL_TANIMLARI_SECTIONS = new Set([
  'language',
  'lang-forms',
  'lang-menus',
  'lang-reports',
  'nationalities',
]);

export type DilTanimlariSection =
  | 'language'
  | 'lang-forms'
  | 'lang-menus'
  | 'lang-reports'
  | 'nationalities';

export function isDilTanimlariSection(section: string | null): section is DilTanimlariSection {
  return Boolean(section && DIL_TANIMLARI_SECTIONS.has(section));
}

export const DIL_TANIMLARI_TABS: { id: DilTanimlariSection; labelKey: string; href: string }[] = [
  { id: 'language', labelKey: 'dil.tab.languages', href: '/settings?section=language' },
  { id: 'lang-forms', labelKey: 'dil.tab.forms', href: '/settings?section=lang-forms' },
  { id: 'lang-menus', labelKey: 'dil.tab.menus', href: '/settings?section=lang-menus' },
  { id: 'lang-reports', labelKey: 'dil.tab.reports', href: '/settings?section=lang-reports' },
  { id: 'nationalities', labelKey: 'dil.tab.nationalities', href: '/settings?section=nationalities' },
];
