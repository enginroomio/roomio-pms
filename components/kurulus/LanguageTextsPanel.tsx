'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import tr from '@/lib/i18n/tr.json';
import en from '@/lib/i18n/en.json';

type View = 'forms' | 'menus' | 'reports';

const PREFIX: Record<View, string[]> = {
  forms: ['reservations.', 'forms.', 'kurulus.'],
  menus: ['sidebar.', 'nav.', 'kurulus.'],
  reports: ['reports.', 'eod.'],
};

const DESC_KEYS: Record<View, string> = {
  forms: 'dil.forms.desc',
  menus: 'dil.menus.desc',
  reports: 'dil.reports.desc',
};

const PAGE_SIZE = 150;

export function LanguageTextsPanel({ view }: { view: View }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [previewLocale, setPreviewLocale] = useState<'tr' | 'en' | 'both'>('both');

  const rows = useMemo(() => {
    const prefixes = PREFIX[view];
    const trDict = tr as Record<string, string>;
    const enDict = en as Record<string, string>;
    const keys = new Set<string>();
    for (const dict of [trDict, enDict]) {
      for (const key of Object.keys(dict)) {
        if (prefixes.some((p) => key.startsWith(p))) keys.add(key);
      }
    }
    const query = q.trim().toLowerCase();
    return [...keys]
      .sort()
      .filter((key) => {
        if (!query) return true;
        const trVal = trDict[key] ?? '';
        const enVal = enDict[key] ?? '';
        return (
          key.toLowerCase().includes(query)
          || trVal.toLowerCase().includes(query)
          || enVal.toLowerCase().includes(query)
        );
      })
      .slice(0, PAGE_SIZE)
      .map((key) => ({
        key,
        tr: trDict[key] ?? '—',
        en: enDict[key] ?? '—',
      }));
  }, [view, q]);

  const totalMatches = useMemo(() => {
    const prefixes = PREFIX[view];
    const keys = new Set<string>();
    for (const dict of [tr, en] as Record<string, string>[]) {
      for (const key of Object.keys(dict)) {
        if (prefixes.some((p) => key.startsWith(p))) keys.add(key);
      }
    }
    const query = q.trim().toLowerCase();
    if (!query) return keys.size;
    return [...keys].filter((key) => {
      const trVal = (tr as Record<string, string>)[key] ?? '';
      const enVal = (en as Record<string, string>)[key] ?? '';
      return key.toLowerCase().includes(query) || trVal.toLowerCase().includes(query) || enVal.toLowerCase().includes(query);
    }).length;
  }, [view, q]);

  return (
    <div className="roomio-detail-grid">
      <div className="roomio-card" style={{ padding: 20 }}>
        <p className="roomio-page-desc">{t(DESC_KEYS[view])}</p>
        <div className="roomio-form-actions" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <input
            className="roomio-input"
            placeholder={t('dil.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 360, minWidth: 200 }}
            aria-label={t('dil.searchPlaceholder')}
          />
          <label className="roomio-field" style={{ margin: 0 }}>
            <span className="roomio-field__label">{t('dil.previewLocale')}</span>
            <select
              className="roomio-input"
              value={previewLocale}
              onChange={(e) => setPreviewLocale(e.target.value as 'tr' | 'en' | 'both')}
            >
              <option value="both">{t('dil.previewBoth')}</option>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 10 }}>
          {t('dil.matchCount', { shown: String(rows.length), total: String(totalMatches) })}
          {totalMatches > PAGE_SIZE ? ` · ${t('dil.truncated')}` : ''}
        </p>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>i18n anahtarı</th>
              {(previewLocale === 'both' || previewLocale === 'tr') ? <th>Türkçe</th> : null}
              {(previewLocale === 'both' || previewLocale === 'en') ? <th>English</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={previewLocale === 'both' ? 3 : 2} className="roomio-table-empty">{t('dil.noMatch')}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.key}>
                <td><code style={{ fontSize: '0.8rem' }}>{r.key}</code></td>
                {(previewLocale === 'both' || previewLocale === 'tr') ? <td>{r.tr}</td> : null}
                {(previewLocale === 'both' || previewLocale === 'en') ? <td>{r.en}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
          {t('dil.sourceHint')}
        </p>
      </div>
    </div>
  );
}
