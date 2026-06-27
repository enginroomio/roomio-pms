'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';

type Agency = {
  id: string;
  code: string;
  name: string;
  commission: number;
  contractEnd?: string;
  market?: string;
  active: boolean;
};

export function AgenciesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', commission: 15, contractEnd: '', market: 'OTA' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/agencies?all=1');
      const json = (await res.json()) as { agencies?: Agency[] };
      setAgencies(json.agencies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!form.code.trim() || !form.name.trim()) {
      setMsg(t('kurulus.agencies.required'));
      return;
    }
    setMsg(null);
    try {
      const res = await roomioFetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? t('kurulus.agencies.saveError'));
      setForm({ code: '', name: '', commission: 15, contractEnd: '', market: 'OTA' });
      setMsg(t('kurulus.agencies.saved'));
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('kurulus.agencies.saveError'));
    }
  }

  return (
    <div>
      <div className="roomio-form-grid roomio-form-grid--3" style={{ marginBottom: 16 }}>
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.col.code')}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.agencies.agency')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <KurulusFormInput
          canAdmin={canAdmin}
          label={t('kurulus.agencies.commission')}
          type="number"
          value={form.commission}
          onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
        />
      </div>
      <KurulusAdminGate>
        <Button onClick={() => void save()}>{t('kurulus.agencies.save')}</Button>
      </KurulusAdminGate>

      <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.col.code')}</th>
              <th>{t('kurulus.agencies.agency')}</th>
              <th>{t('kurulus.agencies.col.commission')}</th>
              <th>{t('kurulus.agencies.col.end')}</th>
              <th>{t('kurulus.agencies.col.market')}</th>
              <th>{t('kurulus.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>{t('kurulus.loading')}</td>
              </tr>
            ) : (
              agencies.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.code}</strong>
                  </td>
                  <td>{a.name}</td>
                  <td>%{a.commission}</td>
                  <td>{a.contractEnd ?? '—'}</td>
                  <td>{a.market ?? '—'}</td>
                  <td>{a.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
    </div>
  );
}
