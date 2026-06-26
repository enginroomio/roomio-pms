'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import tr from '@/lib/i18n/tr.json';
import en from '@/lib/i18n/en.json';

type View = 'forms' | 'menus' | 'reports';

const PREFIX: Record<View, string[]> = {
  forms: ['reservations.', 'forms.', 'kurulus.'],
  menus: ['sidebar.', 'nav.', 'kurulus.'],
  reports: ['reports.', 'eod.'],
};

const TITLES: Record<View, string> = {
  forms: 'Form metinleri',
  menus: 'Menü metinleri',
  reports: 'Rapor metinleri',
};

export function LanguageTextsPanel({ view }: { view: View }) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState('');
  const dict = locale === 'en' ? en : tr;

  const rows = useMemo(() => {
    const prefixes = PREFIX[view];
    const entries = Object.entries(dict as Record<string, string>).filter(([key]) =>
      prefixes.some((p) => key.startsWith(p)),
    );
    const query = q.trim().toLowerCase();
    return entries
      .filter(([key, val]) => !query || key.toLowerCase().includes(query) || val.toLowerCase().includes(query))
      .slice(0, 120)
      .map(([key, value]) => ({ key, value }));
  }, [dict, view, q]);

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">{TITLES[view]}</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          {view === 'forms' && 'Rezervasyon sihirbazı ve kuruluş form etiketleri.'}
          {view === 'menus' && 'Sol menü, navigasyon ve kısayol metinleri.'}
          {view === 'reports' && 'Rapor başlıkları, sekme ve export metinleri.'}
          {' '}Özelleştirme için dil paketini düzenleyin veya{' '}
          <Link href="/settings?section=language" className="roomio-link">dil tanımları</Link>ndan yeni dil ekleyin.
        </p>
        <input
          className="roomio-input"
          placeholder="Anahtar veya metin ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginTop: 12, maxWidth: 420 }}
        />
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="ghost" href="/settings?section=language">{t('nav.kurulus.language')}</Button>
          <Button variant="ghost" href="/settings?tab=theme">Tema</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>i18n anahtarı</th><th>Metin ({locale})</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={2} className="roomio-table-empty">Eşleşme yok.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.key}>
                <td><code style={{ fontSize: '0.8rem' }}>{r.key}</code></td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
          İlk 120 eşleşme gösteriliyor. Tam liste: <code>lib/i18n/{locale}.json</code>
        </p>
      </div>
    </div>
  );
}
