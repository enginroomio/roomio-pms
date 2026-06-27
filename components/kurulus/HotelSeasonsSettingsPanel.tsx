'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { HotelSeasonRow } from '@/lib/server/hotel-seasons';

type Props = {
  view?: 'list' | 'open-close';
};

export function HotelSeasonsSettingsPanel({ view = 'list' }: Props) {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [seasons, setSeasons] = useState<HotelSeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    start: '',
    end: '',
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/hotel-seasons');
      const j = (await res.json()) as { seasons?: HotelSeasonRow[] };
      setSeasons(j.seasons ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/hotel-seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ code: '', name: '', start: '', end: '', active: true });
    setShowForm(false);
    await load();
  }

  const title = view === 'open-close'
    ? `${t('kurulus.seasons.openClose')} (${t('kurulus.live')})`
    : `${t('kurulus.seasons.title')} (${t('kurulus.live')})`;

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{title}</h2>
        {view === 'list' ? (
          <KurulusAdminGate>
            <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.seasons.new')}</Button>
          </KurulusAdminGate>
        ) : null}
      </div>
      {showForm && view === 'list' ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.seasons.col.seasonName')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.seasons.col.open')} type="date" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.seasons.col.close')} type="date" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            {view === 'open-close' ? (
              <tr><th>{t('kurulus.seasons.col.season')}</th><th>{t('kurulus.seasons.col.open')}</th><th>{t('kurulus.seasons.col.close')}</th></tr>
            ) : (
              <tr><th>{t('kurulus.col.code')}</th><th>{t('kurulus.seasons.col.season')}</th><th>{t('kurulus.seasons.col.open')}</th><th>{t('kurulus.seasons.col.close')}</th><th>{t('kurulus.col.status')}</th></tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={view === 'open-close' ? 3 : 5}>{t('kurulus.loading')}</td></tr>
            ) : view === 'open-close' ? (
              seasons.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.start}</td>
                  <td>{s.end}</td>
                </tr>
              ))
            ) : (
              seasons.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.name}</td>
                  <td>{s.start}</td>
                  <td>{s.end}</td>
                  <td>{s.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
