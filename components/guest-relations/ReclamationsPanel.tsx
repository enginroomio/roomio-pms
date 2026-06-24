'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { ReclamationCase } from '@/lib/data/guest-relations';

const EMPTY_FORM = { guest: '', roomNo: '', subject: '', compensation: '' };

function statusLabel(t: (k: string) => string, status: ReclamationCase['status']) {
  switch (status) {
    case 'Onaylandı': return t('gr.reclamation.status.approved');
    case 'Reddedildi': return t('gr.reclamation.status.rejected');
    case 'Kapandı': return t('gr.reclamation.status.closed');
    default: return t('gr.reclamation.status.review');
  }
}

export function ReclamationsPanel() {
  const { t } = useI18n();
  const [cases, setCases] = useState<ReclamationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/reclamations');
      const j = (await res.json()) as { cases?: ReclamationCase[] };
      setCases(j.cases ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(item: ReclamationCase) {
    setEditingId(item.id);
    setForm({
      guest: item.guest,
      roomNo: item.roomNo,
      subject: item.subject,
      compensation: item.compensation,
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
    await roomioFetch('/api/reclamations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        id: editingId ?? undefined,
        status: editingId ? undefined : 'İncelemede',
      }),
    });
    resetForm();
    await load();
  }

  async function setStatus(id: string, status: ReclamationCase['status']) {
    await roomioFetch('/api/reclamations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', id, status }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.reclamation.deleteConfirm'))) return;
    await roomioFetch(`/api/reclamations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('gr.complaints.cancel') : t('gr.reclamation.add')}
        </Button>
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.complaints.col.guest')}</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} required /></label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.reclamation.subject')}</span><input className="roomio-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required /></label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.reclamation.compensation')}</span><input className="roomio-input" value={form.compensation} onChange={(e) => setForm((p) => ({ ...p, compensation: e.target.value }))} required /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.reclamation.ref')}</th>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.complaints.col.guest')}</th>
              <th>{t('gr.complaints.col.room')}</th>
              <th>{t('gr.reclamation.subject')}</th>
              <th>{t('gr.reclamation.compensation')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>{t('reception.loading')}</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={8}>{t('gr.complaints.empty')}</td></tr>
            ) : (
              cases.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.refNo}</strong></td>
                  <td>{r.date}</td>
                  <td>{r.guest}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.subject}</td>
                  <td>{r.compensation}</td>
                  <td><span className="roomio-pill">{statusLabel(t, r.status)}</span></td>
                  <td>
                    {r.status === 'İncelemede' ? (
                      <>
                        <Button variant="secondary" onClick={() => void setStatus(r.id, 'Onaylandı')}>{t('gr.reclamation.approve')}</Button>
                        {' '}
                        <Button variant="ghost" onClick={() => void setStatus(r.id, 'Reddedildi')}>{t('gr.reclamation.reject')}</Button>
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
        <TableFooter total={cases.length} />
      </div>
    </>
  );
}
