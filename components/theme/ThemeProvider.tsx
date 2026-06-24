'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'classic';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'roomio-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'classic') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    const initial = resolveInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (next: ThemeMode) => {
    setThemeState(next);
    applyTheme(next);
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme ThemeProvider içinde kullanılmalı');
  return ctx;
}
