'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Lock, Moon, Palette, Sun } from 'lucide-react';
import { ThemeMockupPreview } from '@/components/theme/ThemeMockupPreview';
import { ThemePreviewFit } from '@/components/theme/ThemePreviewFit';
import { useTheme, type ThemeMode } from '@/components/theme/ThemeProvider';
import {
  buildShowcaseScreens,
  SHOWCASE_PHASES,
} from '@/lib/theme/screen-showcase';

const THEME_FIXED_KEY = 'roomio-theme-fixed';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Standart', icon: Sun },
  { id: 'dark', label: 'Koyu', icon: Moon },
  { id: 'classic', label: 'Klasik', icon: Palette },
];

type Props = {
  initialTheme?: ThemeMode | null;
  fixed?: boolean;
};

export function ThemeScreen({ initialTheme, fixed: fixedProp }: Props) {
  const { theme, setTheme } = useTheme();
  const screens = useMemo(() => buildShowcaseScreens(), []);
  const [phaseId, setPhaseId] = useState(SHOWCASE_PHASES[0]?.id ?? 'shell');
  const [screenId, setScreenId] = useState(screens[0]?.id ?? 'shell-rail');
  const [fixed, setFixed] = useState(false);

  const phaseScreens = useMemo(
    () => screens.filter((s) => s.phaseId === phaseId),
    [screens, phaseId],
  );

  const activeScreen = useMemo(
    () => screens.find((s) => s.id === screenId) ?? phaseScreens[0] ?? screens[0],
    [screens, screenId, phaseScreens],
  );

  useEffect(() => {
    if (initialTheme) setTheme(initialTheme);
  }, [initialTheme, setTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(THEME_FIXED_KEY) === '1';
    setFixed(fixedProp ?? stored);
  }, [fixedProp]);

  useEffect(() => {
    if (!phaseScreens.some((s) => s.id === screenId)) {
      setScreenId(phaseScreens[0]?.id ?? screenId);
    }
  }, [phaseId, phaseScreens, screenId]);

  function toggleFixed() {
    const next = !fixed;
    setFixed(next);
    window.localStorage.setItem(THEME_FIXED_KEY, next ? '1' : '0');
  }

  return (
    <div className="roomio-theme-screen">
      <div className="roomio-theme-screen__toolbar">
        <div className="roomio-theme-screen__toolbar-left">
          <h1 className="roomio-theme-screen__title">Tema Ekranı</h1>
          <div className="roomio-theme-screen__themes" role="tablist" aria-label="Tema seçimi">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={theme === opt.id}
                  className={`roomio-theme-screen__theme-btn${theme === opt.id ? ' is-active' : ''}`}
                  onClick={() => setTheme(opt.id)}
                  title={opt.label}
                >
                  <Icon size={14} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`roomio-theme-screen__theme-btn roomio-theme-screen__theme-btn--fixed${fixed ? ' is-active' : ''}`}
              onClick={toggleFixed}
              title="Tema sabitle"
            >
              <Lock size={13} />
            </button>
          </div>
        </div>

        <div className="roomio-theme-screen__toolbar-mid">
          <label className="roomio-theme-screen__select-wrap">
            <span className="sr-only">Modül fazı</span>
            <select
              className="roomio-select roomio-select--sm roomio-theme-screen__select"
              value={phaseId}
              onChange={(e) => setPhaseId(e.target.value)}
              aria-label="Modül fazı"
            >
              {SHOWCASE_PHASES.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.order}. {phase.title}
                </option>
              ))}
            </select>
          </label>
          <label className="roomio-theme-screen__select-wrap">
            <span className="sr-only">Ekran</span>
            <select
              className="roomio-select roomio-select--sm roomio-theme-screen__select roomio-theme-screen__select--wide"
              value={screenId}
              onChange={(e) => setScreenId(e.target.value)}
              aria-label="Ekran seçimi"
            >
              {phaseScreens.map((screen) => (
                <option key={screen.id} value={screen.id}>
                  {screen.label}
                  {screen.preview ? ' · canlı' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="roomio-theme-screen__toolbar-right">
          <Link href="/tools/rollout" className="roomio-btn roomio-btn--ghost roomio-btn--sm">
            Rollout
          </Link>
          {activeScreen ? (
            <Link
              href={activeScreen.href}
              className="roomio-btn roomio-btn--primary roomio-btn--sm"
              target="_blank"
            >
              <ExternalLink size={14} /> Aç
            </Link>
          ) : null}
        </div>
      </div>

      <div className="roomio-theme-screen__preview">
        <ThemePreviewFit>
          {activeScreen?.preview ? (
            <div className="roomio-theme-screen__preview-live">
              <ThemeMockupPreview kind={activeScreen.preview} />
            </div>
          ) : activeScreen?.mockupImage ? (
            <div className="roomio-theme-screen__preview-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeScreen.mockupImage}
                alt={activeScreen.label}
                className="roomio-theme-screen__preview-img"
              />
            </div>
          ) : null}
        </ThemePreviewFit>

        <footer className="roomio-theme-screen__preview-meta">
          <strong>{activeScreen?.label}</strong>
          {activeScreen?.screenRef ? (
            <span className="roomio-badge">Ref: {activeScreen.screenRef}</span>
          ) : null}
          <span className="roomio-theme-screen__preview-hint">
            {activeScreen?.preview ? 'Canlı mockup' : 'Referans görsel'}
          </span>
        </footer>
      </div>
    </div>
  );
}
