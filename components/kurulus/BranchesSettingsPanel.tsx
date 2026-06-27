'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { PropertyBranchRow } from '@/lib/server/property-branches';

export function BranchesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [branches, setBranches] = useState<PropertyBranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', city: '', rooms: '', active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/property-branches');
      const j = (await res.json()) as { branches?: PropertyBranchRow[] };
      setBranches(j.branches ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/property-branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        city: form.city,
        rooms: Number(form.rooms),
        active: form.active,
      }),
    });
    setForm({ code: '', name: '', city: '', rooms: '', active: true });
    setShowForm(false);
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.branches.title')} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.branches.new')}</Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.branches.col.branch')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.branches.col.city')} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.branches.col.rooms')} type="number" min={0} value={form.rooms} onChange={(e) => setForm((p) => ({ ...p, rooms: e.target.value }))} />
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
              <th>{t('kurulus.branches.col.branch')}</th>
              <th>{t('kurulus.branches.col.city')}</th>
              <th>{t('kurulus.branches.col.rooms')}</th>
              <th>{t('kurulus.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>{t('kurulus.loading')}</td></tr>
            ) : branches.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.name}</td>
                <td>{row.city}</td>
                <td>{row.rooms}</td>
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
