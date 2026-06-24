'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { MealPriceRow } from '@/lib/server/meal-prices';

export function MealPricesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [prices, setPrices] = useState<MealPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mealPlan: 'BB',
    roomType: 'STD',
    adultPrice: '',
    childPrice: '',
    seasonName: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/meal-prices');
      const j = (await res.json()) as { prices?: MealPriceRow[] };
      setPrices(j.prices ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/meal-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealPlan: form.mealPlan,
        roomType: form.roomType,
        adultPrice: Number(form.adultPrice),
        childPrice: Number(form.childPrice),
        seasonName: form.seasonName,
      }),
    });
    setForm({ mealPlan: 'BB', roomType: 'STD', adultPrice: '', childPrice: '', seasonName: '' });
    setShowForm(false);
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.mealPrices.title')} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('kurulus.cancel') : t('kurulus.mealPrices.new')}</Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.mealPrices.col.mealPlan')} value={form.mealPlan} onChange={(e) => setForm((p) => ({ ...p, mealPlan: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.mealPrices.col.roomType')} value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.mealPrices.col.season')} value={form.seasonName} onChange={(e) => setForm((p) => ({ ...p, seasonName: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.mealPrices.adultPrice')} type="number" min={0} value={form.adultPrice} onChange={(e) => setForm((p) => ({ ...p, adultPrice: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.mealPrices.childPrice')} type="number" min={0} value={form.childPrice} onChange={(e) => setForm((p) => ({ ...p, childPrice: e.target.value }))} />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.mealPrices.col.mealPlan')}</th>
              <th>{t('kurulus.mealPrices.col.roomType')}</th>
              <th>{t('kurulus.mealPrices.col.adult')}</th>
              <th>{t('kurulus.mealPrices.col.child')}</th>
              <th>{t('kurulus.mealPrices.col.season')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>{t('kurulus.loading')}</td></tr>
            ) : prices.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.mealPlan}</strong></td>
                <td>{row.roomType}</td>
                <td>{row.adultLabel}</td>
                <td>{row.childLabel}</td>
                <td>{row.seasonName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
