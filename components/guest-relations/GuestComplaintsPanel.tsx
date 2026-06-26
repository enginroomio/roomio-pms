'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { ComplaintItem } from '@/lib/data/guest-relations';

const EMPTY_FORM = {
  roomNo: '',
  guest: '',
  category: 'Genel',
  description: '',
  priority: 'Normal' as ComplaintItem['priority'],
};

export function GuestComplaintsPanel({ autoOpenForm = false }: { autoOpenForm?: boolean } = {}) {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(autoOpenForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/guest-complaints');
      const j = (await res.json()) as { complaints?: ComplaintItem[] };
      setComplaints(j.complaints ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);

  function startEdit(item: ComplaintItem) {
    setEditingId(item.id);
    setForm({
      roomNo: item.roomNo,
      guest: item.guest,
      category: item.category,
      description: item.description,
      priority: item.priority,
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
    await roomioFetch('/api/guest-complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editingId ?? undefined }),
    });
    resetForm();
    await load();
  }

  async function resolve(id: string) {
    await roomioFetch('/api/guest-complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', id }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.complaints.deleteConfirm'))) return;
    await roomioFetch(`/api/guest-complaints?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('gr.complaints.cancel') : t('gr.complaints.add')}
        </Button>
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.complaints.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.guest')}</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.category')}</span><input className="roomio-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.priority')}</span>
              <select className="roomio-select" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as ComplaintItem['priority'] }))}>
                <option value="Normal">Normal</option>
                <option value="Acil">Acil</option>
              </select>
            </label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.complaints.col.description')}</span><input className="roomio-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.complaints.col.room')}</th>
              <th>{t('gr.complaints.col.guest')}</th>
              <th>{t('gr.complaints.col.category')}</th>
              <th>{t('gr.complaints.col.description')}</th>
              <th>{t('gr.complaints.col.priority')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>{t('reception.loading')}</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan={8}>{t('gr.complaints.empty')}</td></tr>
            ) : (
              complaints.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.guest}</td>
                  <td>{r.category}</td>
                  <td>{r.description}</td>
                  <td>{r.priority === 'Acil' ? <span className="roomio-text-warn">Acil</span> : 'Normal'}</td>
                  <td>{r.status}</td>
                  <td>
                    {r.status === 'Açık' ? (
                      <>
                        <Button variant="secondary" onClick={() => void resolve(r.id)}>{t('gr.complaints.resolve')}</Button>
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
        <TableFooter total={complaints.length} />
      </div>
    </>
  );
}
