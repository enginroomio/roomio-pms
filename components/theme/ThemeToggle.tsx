'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="roomio-header-icon-btn"
      aria-label={theme === 'light' ? 'Koyu tema' : 'Açık tema'}
      title={theme === 'light' ? 'Koyu tema' : 'Açık tema'}
      onClick={toggleTheme}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
