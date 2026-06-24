export type Locale = 'tr' | 'en';

export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en'];

const PARAM_RE = /\{(\w+)\}/g;

/** `{name}` değişkenlerini çöz */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(PARAM_RE, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

export function translate(
  catalog: Record<string, string>,
  key: string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  const raw = catalog[key] ?? fallback ?? key;
  return interpolate(raw, params);
}

export function mergeCatalogs(...parts: Array<Record<string, string>>): Record<string, string> {
  return Object.assign({}, ...parts);
}

/** Tarayıcı dilinden desteklenen locale seç */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'tr';
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language ?? 'tr'];
  for (const lang of langs) {
    const code = lang.toLowerCase();
    if (code.startsWith('en')) return 'en';
    if (code.startsWith('tr')) return 'tr';
  }
  return 'tr';
}

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
