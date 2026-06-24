'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusEditButton, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import type { RoomTypeDefRow } from '@/lib/server/property-room-inventory';

const EMPTY_FORM = {
  code: '',
  short: '',
  name: '',
  bedType: 'Double',
  maxPersons: '2',
  maxAdults: '2',
  maxChildren: '0',
  baseRate: '',
  active: true,
};

export function RoomTypesSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [types, setTypes] = useState<RoomTypeDefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/room-type-defs');
      const j = (await res.json()) as { types?: RoomTypeDefRow[] };
      setTypes(j.types ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: RoomTypeDefRow) {
    setEditingCode(row.code);
    setForm({
      code: row.code,
      short: row.short,
      name: row.name,
      bedType: row.bedType,
      maxPersons: String(row.maxPersons),
      maxAdults: String(row.maxAdults),
      maxChildren: String(row.maxChildren),
      baseRate: String(row.baseRate),
      active: row.active,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingCode(null);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/room-type-defs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        short: form.short,
        name: form.name,
        bedType: form.bedType,
        maxPersons: Number(form.maxPersons),
        maxAdults: Number(form.maxAdults),
        maxChildren: Number(form.maxChildren),
        baseRate: Number(form.baseRate),
        active: form.active,
      }),
    });
    resetForm();
    await load();
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.roomTypes.title')} ({t('kurulus.live')})</h2>
        <span className="roomio-badge">{t('kurulus.roomTypes.count').replace('{count}', String(types.length))}</span>
        <KurulusAdminGate>
          <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? t('kurulus.cancel') : t('kurulus.roomTypes.new')}
          </Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.code')} value={form.code} disabled={Boolean(editingCode)} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.roomTypes.col.short')} value={form.short} onChange={(e) => setForm((p) => ({ ...p, short: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.col.name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.roomTypes.col.bed')} value={form.bedType} onChange={(e) => setForm((p) => ({ ...p, bedType: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.roomTypes.col.capacity')} type="number" min={1} value={form.maxPersons} onChange={(e) => setForm((p) => ({ ...p, maxPersons: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.roomTypes.col.baseRate')} type="number" min={0} value={form.baseRate} onChange={(e) => setForm((p) => ({ ...p, baseRate: e.target.value }))} />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>{t('kurulus.col.code')}</th><th>{t('kurulus.roomTypes.col.short')}</th><th>{t('kurulus.col.name')}</th><th>{t('kurulus.roomTypes.col.bed')}</th><th>{t('kurulus.roomTypes.col.capacity')}</th><th>{t('kurulus.roomTypes.col.baseRate')}</th><th>{t('kurulus.col.status')}</th><th /></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>{t('kurulus.loading')}</td></tr>
            ) : types.map((row) => (
              <tr key={row.code}>
                <td><strong>{row.code}</strong></td>
                <td>{row.short}</td>
                <td>{row.name}</td>
                <td>{row.bedType}</td>
                <td>{row.maxPersons}</td>
                <td>₺{row.baseRate.toLocaleString('tr-TR')}</td>
                <td>{row.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                <td><KurulusEditButton onClick={() => startEdit(row)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
