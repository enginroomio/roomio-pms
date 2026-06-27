'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { KurulusAdminGate, KurulusEditButton, KurulusFormCheckbox, KurulusFormInput, useKurulusAdmin } from '@/components/kurulus/KurulusAdminGate';
import { roomioFetch } from '@/lib/client/api';
import { reloadPropertyInventory } from '@/lib/client/reload-property-inventory';
import type { PropertyRoomRow } from '@/lib/server/property-room-inventory';

const EMPTY_FORM = {
  roomNo: '',
  floor: '',
  typeCode: 'DBL',
  location: '',
  building: 'Ana Bina',
  isActive: true,
};

export function PropertyRoomsSettingsPanel() {
  const { t } = useI18n();
  const canAdmin = useKurulusAdmin();
  const [rooms, setRooms] = useState<PropertyRoomRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/property-rooms?limit=40');
      const j = (await res.json()) as { rooms?: PropertyRoomRow[]; total?: number };
      setRooms(j.rooms ?? []);
      setTotal(j.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: PropertyRoomRow) {
    setEditingRoom(row.roomNo);
    setForm({
      roomNo: row.roomNo,
      floor: String(row.floor),
      typeCode: row.typeCode,
      location: row.location ?? '',
      building: row.building,
      isActive: row.isActive,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingRoom(null);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/property-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNo: form.roomNo,
        floor: Number(form.floor),
        typeCode: form.typeCode,
        location: form.location || undefined,
        building: form.building,
        isActive: form.isActive,
      }),
    });
    resetForm();
    await load();
    await reloadPropertyInventory().catch(() => undefined);
  }

  return (
    <div className="roomio-card">
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{t('kurulus.propertyRooms.title')} ({t('kurulus.live')})</h2>
        <span className="roomio-text-muted" style={{ fontSize: '0.85rem' }}>
          {t('kurulus.propertyRooms.roomCountHint').replace('{total}', String(total))}
        </span>
        <KurulusAdminGate>
          <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? t('kurulus.cancel') : t('kurulus.propertyRooms.new')}
          </Button>
        </KurulusAdminGate>
      </div>
      {showForm ? (
        <KurulusAdminGate>
        <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
          <div className="roomio-form-grid">
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.propertyRooms.roomNo')} value={form.roomNo} disabled={Boolean(editingRoom)} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.floors.col.floor')} type="number" min={1} value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.propertyRooms.col.type')} value={form.typeCode} onChange={(e) => setForm((p) => ({ ...p, typeCode: e.target.value.toUpperCase() }))} />
            <KurulusFormInput canAdmin={canAdmin} label={t('kurulus.lostFound.location')} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            <KurulusFormCheckbox canAdmin={canAdmin} label={t('kurulus.active')} checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('kurulus.save')}</Button></div>
        </form>
        </KurulusAdminGate>
      ) : null}
      <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('kurulus.propertyRooms.col.room')}</th>
              <th>{t('kurulus.floors.col.floor')}</th>
              <th>{t('kurulus.propertyRooms.col.type')}</th>
              <th>{t('kurulus.lostFound.location')}</th>
              <th>{t('kurulus.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>{t('kurulus.loading')}</td></tr>
            ) : rooms.map((r) => (
              <tr key={r.roomNo}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.floor}</td>
                <td>{r.typeCode}</td>
                <td>{r.location ?? '—'}</td>
                <td>{r.isActive ? t('kurulus.active') : t('kurulus.closed')}</td>
                <td><KurulusEditButton onClick={() => startEdit(r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
