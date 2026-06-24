'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusEditButton, KurulusFormCheckbox, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import { reloadPropertyInventory } from '@/lib/client/reload-property-inventory';
import type { PropertyFloorRow } from '@/lib/server/property-room-inventory';

export function FloorsSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [floors, setFloors] = useState<PropertyFloorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ floor: '', start: '', end: '', active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/property-floors');
      const j = (await res.json()) as { floors?: PropertyFloorRow[] };
      setFloors(j.floors ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: PropertyFloorRow) {
    setEditingId(row.id);
    setForm({
      floor: String(row.floor),
      start: String(row.start),
      end: String(row.end),
      active: row.active,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ floor: '', start: '', end: '', active: true });
    setEditingId(null);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/property-floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId ?? undefined,
        floor: Number(form.floor),
        start: Number(form.start),
        end: Number(form.end),
        active: form.active,
      }),
    });
    resetForm();
    await load();
    await reloadPropertyInventory().catch(() => undefined);
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.floors.title')} ({t('kurulus.live')})</h2>
        <KurulusAdminGate>
          <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? t('kurulus.cancel') : t('kurulus.floors.new')}
          </Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput
              canAdmin={canAdmin}
              label={t('kurulus.floors.col.floorNo')}
              type="number"
              min={1}
              value={form.floor}
              disabled={Boolean(editingId)}
              onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
            />
            <KurulusFormInput
              canAdmin={canAdmin}
              label={t('kurulus.floors.col.startRoom')}
              type="number"
              value={form.start}
              onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
            />
            <KurulusFormInput
              canAdmin={canAdmin}
              label={t('kurulus.floors.col.endRoom')}
              type="number"
              value={form.end}
              onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
            />
            <KurulusFormCheckbox
              canAdmin={canAdmin}
              label={t('kurulus.active')}
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>{t('kurulus.floors.col.floor')}</th><th>{t('kurulus.seasons.col.open')}</th><th>{t('kurulus.seasons.col.close')}</th><th>{t('kurulus.hotelInfo.roomCount')}</th><th>{t('kurulus.col.status')}</th><th /></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>{t('kurulus.loading')}</td></tr>
            ) : floors.map((f) => (
              <tr key={f.id}>
                <td><strong>{t('kurulus.floors.floorLabel').replace('{floor}', String(f.floor))}</strong></td>
                <td>{f.start}</td>
                <td>{f.end}</td>
                <td>{f.roomCount}</td>
                <td>{f.active ? t('kurulus.active') : t('kurulus.inactive')}</td>
                <td><KurulusEditButton onClick={() => startEdit(f)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
