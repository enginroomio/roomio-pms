'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import tr from '@/lib/i18n/tr.json';
import en from '@/lib/i18n/en.json';
import {
  detectBrowserLocale,
  isLocale,
  mergeCatalogs,
  translate,
  type Locale,
} from '@/lib/i18n/engine';
import { roomioFetch } from '@/lib/client/api';

const CLIENT_LOCALE_KEY = 'roomio-locale';
const BASE: Record<Locale, Record<string, string>> = { tr, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export type { Locale };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr');
  const [remote, setRemote] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_LOCALE_KEY);
    const initial = stored && isLocale(stored) ? stored : detectBrowserLocale();
    setLocaleState(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    void roomioFetch(`/api/locale?locale=${locale}`)
      .then((r) => r.json())
      .then((j: { messages?: Record<string, string> }) => {
        if (j.messages) setRemote(j.messages);
      });
  }, [locale, ready]);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(CLIENT_LOCALE_KEY, l);
    setLocaleState(l);
  }, []);

  const catalog = useMemo(
    () => mergeCatalogs(BASE[locale], remote),
    [locale, remote],
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>, fallback?: string) =>
      translate(catalog, key, params, fallback),
    [catalog],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n requires I18nProvider');
  return ctx;
}
