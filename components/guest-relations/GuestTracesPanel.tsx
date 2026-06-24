'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { submitGuestTrace } from '@/lib/client/guest-trace-submit';
import type { TraceItem } from '@/lib/data/guest-relations';

type Trace = TraceItem & { id: string; notes?: string };

const EMPTY_FORM = {
  guest: '',
  roomNo: '',
  subject: '',
  due: '',
  assignee: 'Ön Büro',
};

export function GuestTracesPanel() {
  const { t } = useI18n();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/guest-traces');
      const j = (await res.json()) as { traces?: Trace[] };
      setTraces(j.traces ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(trace: Trace) {
    setEditingId(trace.id);
    setForm({
      guest: trace.guest,
      roomNo: trace.roomNo,
      subject: trace.subject,
      due: trace.due,
      assignee: trace.assignee,
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setMsg(null);
  }

  async function saveTrace(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guest.trim() || !form.roomNo.trim() || !form.subject.trim() || !form.due.trim()) {
      setMsg(t('gr.traces.requiredFields'));
      return;
    }
    setMsg(null);
    const result = await submitGuestTrace({
      ...form,
      id: editingId ?? undefined,
      date: new Date().toISOString().slice(0, 10),
      status: 'Açık',
    });
    if (!result.ok || !result.trace) {
      setMsg(t('gr.traces.saveFailed'));
      return;
    }
    if (result.queued) {
      setMsg(t('gr.traces.queued'));
    }
    resetForm();
    await load();
  }

  async function complete(id: string) {
    await roomioFetch('/api/guest-traces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', id }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.traces.deleteConfirm'))) return;
    await roomioFetch(`/api/guest-traces?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('gr.complaints.cancel') : t('gr.traces.add')}
        </Button>
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void saveTrace(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.complaints.col.guest')}</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} required /></label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.traces.subject')}</span><input className="roomio-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.traces.due')}</span><input className="roomio-input" value={form.due} onChange={(e) => setForm((p) => ({ ...p, due: e.target.value }))} placeholder="19.06 06:00" required /></label>
            <label className="roomio-field"><span>{t('gr.traces.assignee')}</span><input className="roomio-input" value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))} required /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
          {msg ? <p className="roomio-page-desc roomio-text-warn">{msg}</p> : null}
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.complaints.col.guest')}</th>
              <th>{t('gr.complaints.col.room')}</th>
              <th>{t('gr.traces.subject')}</th>
              <th>{t('gr.traces.due')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th>{t('gr.traces.assignee')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}>{t('reception.loading')}</td></tr>
            ) : traces.length === 0 ? (
              <tr><td colSpan={8}>{t('gr.traces.empty')}</td></tr>
            ) : (
              traces.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.guest}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.subject}</td>
                  <td>{r.due}</td>
                  <td><span className={`roomio-pill${r.status === 'Tamamlandı' ? ' roomio-pill--ok' : ''}`}>{r.status === 'Tamamlandı' ? t('gr.traces.status.done') : t('gr.traces.status.open')}</span></td>
                  <td>{r.assignee}</td>
                  <td>
                    {r.status === 'Açık' ? (
                      <>
                        <Button variant="secondary" onClick={() => void complete(r.id)}>{t('gr.traces.complete')}</Button>
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
        <TableFooter total={traces.length} />
      </div>
    </>
  );
}
