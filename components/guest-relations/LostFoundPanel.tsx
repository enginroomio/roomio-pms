'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { LostFoundItem } from '@/lib/data/guest-relations';

const EMPTY_FORM = {
  type: 'Buluntu' as LostFoundItem['type'],
  item: '',
  location: '',
  guest: '',
  roomNo: '',
};

function typeLabel(t: (k: string) => string, type: LostFoundItem['type']) {
  return type === 'Buluntu' ? t('gr.lostFound.type.found') : t('gr.lostFound.type.lost');
}

function statusLabel(t: (k: string) => string, status: LostFoundItem['status']) {
  return status === 'Teslim' ? t('gr.lostFound.status.delivered') : t('gr.lostFound.status.open');
}

export function LostFoundPanel() {
  const { t } = useI18n();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/lost-found');
      const j = (await res.json()) as { items?: LostFoundItem[] };
      setItems(j.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(item: LostFoundItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      item: item.item,
      location: item.location,
      guest: item.guest ?? '',
      roomNo: item.roomNo ?? '',
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editingId ?? undefined, status: 'Açık' }),
    });
    resetForm();
    await load();
  }

  async function deliver(id: string) {
    await roomioFetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deliver', id }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.lostFound.deleteConfirm'))) return;
    await roomioFetch(`/api/lost-found?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('gr.complaints.cancel') : t('gr.lostFound.add')}
        </Button>
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.lostFound.type')}</span>
              <select className="roomio-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LostFoundItem['type'] }))}>
                <option value="Buluntu">{t('gr.lostFound.type.found')}</option>
                <option value="Kayıp">{t('gr.lostFound.type.lost')}</option>
              </select>
            </label>
            <label className="roomio-field"><span>{t('gr.lostFound.item')}</span><input className="roomio-input" value={form.item} onChange={(e) => setForm((p) => ({ ...p, item: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.lostFound.location')}</span><input className="roomio-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.guest')}</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.lostFound.type')}</th>
              <th>{t('gr.lostFound.item')}</th>
              <th>{t('gr.lostFound.location')}</th>
              <th>{t('gr.complaints.col.guest')}</th>
              <th>{t('gr.complaints.col.room')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>{t('reception.loading')}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8}>{t('gr.complaints.empty')}</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{typeLabel(t, r.type)}</td>
                  <td>{r.item}</td>
                  <td>{r.location}</td>
                  <td>{r.guest ?? '—'}</td>
                  <td>{r.roomNo ?? '—'}</td>
                  <td>{statusLabel(t, r.status)}</td>
                  <td>
                    {r.status === 'Açık' ? (
                      <>
                        <Button variant="secondary" onClick={() => void deliver(r.id)}>{t('gr.lostFound.deliver')}</Button>
                        {' '}
                      </>
                    ) : null}
                    <Button variant="ghost" onClick={() => startEdit(r)}>{t('gr.complaints.edit')}</Button>
                    {' '}
                    <Button variant="ghost" onClick={() => void remove(r.id)}>{t('gr.complaints.delete')}</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={items.length} />
      </div>
    </>
  );
}
