'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, KurulusFormSelect, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { ExtraChargeRow } from '@/lib/server/extra-charges';

export function ExtrasSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [charges, setCharges] = useState<ExtraChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    price: '',
    priceUnit: 'gece',
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/extra-charges');
      const j = (await res.json()) as { charges?: ExtraChargeRow[] };
      setCharges(j.charges ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/extra-charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        price: Number(form.price),
        priceUnit: form.priceUnit,
        active: form.active,
      }),
    });
    setForm({ code: '', name: '', price: '', priceUnit: 'gece', active: true });
    setShowForm(false);
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.extras.title')} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.extras.new')}</Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.extras.priceLabel')} type="number" min={0} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
            <KurulusFormSelect canAdmin={canAdmin} label={t('kurulus.extras.col.unit')} value={form.priceUnit} onChange={(e) => setForm((p) => ({ ...p, priceUnit: e.target.value }))}>
              <option value="gece">/gece</option>
              <option value="konaklama">/konaklama</option>
              <option value="adet">/adet</option>
            </KurulusFormSelect>
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
              <th>{t('kurulus.extras.col.price')}</th>
              <th>{t('kurulus.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4}>{t('kurulus.loading')}</td></tr>
            ) : charges.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.name}</td>
                <td>{row.priceLabel}</td>
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
