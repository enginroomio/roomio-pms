'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormCheckbox, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { PropertyLanguageRow } from '@/lib/server/property-languages';

export function LanguagesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [languages, setLanguages] = useState<PropertyLanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    nativeName: '',
    active: true,
    defaultLang: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/property-languages');
      const j = (await res.json()) as { languages?: PropertyLanguageRow[] };
      setLanguages(j.languages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/property-languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ code: '', name: '', nativeName: '', active: true, defaultLang: false });
    setShowForm(false);
    await load();
  }

  return (
    <>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">{t('kurulus.languages.title')} ({t('kurulus.live')})</h2>
          <KurulusAdminGate>
            <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.languages.new')}</Button>
          </KurulusAdminGate>
        </div>
        {!loading && languages.length > 0 ? (
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            {t('dil.languageSummary', {
              active: String(languages.filter((l) => l.active).length),
              defaultLang: languages.find((l) => l.defaultLang)?.code?.toUpperCase() ?? '—',
            })}
          </p>
        ) : null}
        {showForm ? (
          <KurulusAdminGate>
          <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
            <div className="roomio-form-grid">
              <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toLowerCase() }))} />
              <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.languages.col.nativeName')} value={form.nativeName} onChange={(e) => setForm((p) => ({ ...p, nativeName: e.target.value }))} />
              <KurulusFormCheckbox
                canAdmin={canAdmin}
                label={t('kurulus.languages.defaultLang')}
                checked={form.defaultLang}
                onChange={(e) => setForm((p) => ({ ...p, defaultLang: e.target.checked }))}
              />
            </div>
            <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
          </form>
          </KurulusAdminGate>
        ) : null}
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>{t('kurulus.col.code')}</th>
                <th>{t('kurulus.col.name')}</th>
                <th>{t('kurulus.languages.col.nativeName')}</th>
                <th>{t('kurulus.languages.col.default')}</th>
                <th>{t('kurulus.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>{t('kurulus.loading')}</td></tr>
              ) : languages.map((row) => (
                <tr key={row.code}>
                  <td><strong>{row.code}</strong></td>
                  <td>{row.name}</td>
                  <td>{row.nativeName}</td>
                  <td>{row.defaultLang ? t('kurulus.yes') : '—'}</td>
                  <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        {t('kurulus.languages.hint')}
      </p>
    </>
  );
}
