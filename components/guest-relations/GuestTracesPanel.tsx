'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { submitGuestTrace, completeGuestTrace, deleteGuestTrace } from '@/lib/client/guest-trace-submit';
import {
  filterTracesByKind,
  traceKind,
  traceKindTag,
  type TraceKind,
} from '@/lib/guest-relations/trace-meta';
import type { TraceItem } from '@/lib/data/guest-relations';

type Trace = TraceItem & { id: string; notes?: string };

export type GuestTracesPanelProps = {
  filterKind?: TraceKind | 'all';
  view?: 'list' | 'agenda' | 'notes';
  autoOpenForm?: boolean;
  defaultTraceKind?: TraceKind;
  showNotes?: boolean;
};

const EMPTY_FORM = {
  guest: '',
  roomNo: '',
  subject: '',
  due: '',
  assignee: 'Ön Büro',
  notes: '',
  traceKind: 'general' as TraceKind,
};

export function GuestTracesPanel({
  filterKind = 'all',
  view = 'list',
  autoOpenForm = false,
  defaultTraceKind = 'general',
  showNotes = false,
}: GuestTracesPanelProps = {}) {
  const { t } = useI18n();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(autoOpenForm);
  const [showNotesCol, setShowNotesCol] = useState(showNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, traceKind: defaultTraceKind });

  useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);

  useEffect(() => {
    setShowNotesCol(showNotes);
  }, [showNotes]);

  const filteredTraces = useMemo(
    () => filterTracesByKind(traces, filterKind),
    [traces, filterKind],
  );

  const agendaGroups = useMemo(() => {
    const map = new Map<string, Trace[]>();
    for (const t of filteredTraces) {
      const key = t.due.split(' ')[0] ?? t.date;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTraces]);

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
      notes: trace.notes?.replace(/^type:\w+\s*/, '') ?? '',
      traceKind: traceKind(trace),
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, traceKind: defaultTraceKind });
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
    const tag = traceKindTag(form.traceKind);
    const { traceKind: _kind, ...rest } = form;
    const notes = [tag, rest.notes.trim()].filter(Boolean).join(' ') || undefined;
    const result = await submitGuestTrace({
      ...rest,
      notes,
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
    const result = await completeGuestTrace(id);
    if (result.queued) setMsg(t('gr.traces.completeQueued'));
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.traces.deleteConfirm'))) return;
    const result = await deleteGuestTrace(id);
    if (result.queued) setMsg(t('gr.traces.deleteQueued'));
    await load();
  }

  return (
    <>
      <nav className="roomio-tabs" style={{ marginBottom: 12 }}>
        <Link href="/guest-relations/traces" className={`roomio-tab${view === 'list' && filterKind === 'all' ? ' is-active' : ''}`}>Liste</Link>
        <Link href="/guest-relations/traces?tab=agenda" className={`roomio-tab${view === 'agenda' ? ' is-active' : ''}`}>Ajanda</Link>
        <Link href="/guest-relations/traces?type=wakeup" className={`roomio-tab${filterKind === 'wakeup' ? ' is-active' : ''}`}>Uyandırma</Link>
        <Link href="/guest-relations/traces?type=yellow" className={`roomio-tab${filterKind === 'yellow' ? ' is-active' : ''}`}>Sarı notlar</Link>
        <Link href="/guest-relations/traces?view=notes" className={`roomio-tab${view === 'notes' ? ' is-active' : ''}`}>Notlar</Link>
      </nav>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? t('gr.complaints.cancel') : t('gr.traces.add')}
        </Button>
        {view === 'notes' ? (
          <Button variant="secondary" onClick={() => setShowNotesCol((v) => !v)}>
            {showNotesCol ? 'Notları gizle' : 'Notları göster'}
          </Button>
        ) : null}
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void saveTrace(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.complaints.col.guest')}</span><input className="roomio-input" value={form.guest} onChange={(e) => setForm((p) => ({ ...p, guest: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.complaints.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} required /></label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.traces.subject')}</span><input className="roomio-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.traces.due')}</span><input className="roomio-input" value={form.due} onChange={(e) => setForm((p) => ({ ...p, due: e.target.value }))} placeholder="19.06 06:00" required /></label>
            <label className="roomio-field"><span>{t('gr.traces.assignee')}</span><input className="roomio-input" value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))} required /></label>
            <label className="roomio-field"><span>Tip</span>
              <select className="roomio-select" value={form.traceKind} onChange={(e) => setForm((p) => ({ ...p, traceKind: e.target.value as TraceKind }))}>
                <option value="general">Genel</option>
                <option value="wakeup">Uyandırma</option>
                <option value="yellow">Sarı not</option>
                <option value="note">Not</option>
              </select>
            </label>
            <label className="roomio-field roomio-field--full"><span>Not</span><input className="roomio-input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
          {msg ? <p className="roomio-page-desc roomio-text-warn">{msg}</p> : null}
        </form>
      ) : null}
      {view === 'agenda' ? (
        <div className="roomio-detail-grid">
          {agendaGroups.length === 0 ? (
            <p className="roomio-page-desc">Ajanda kaydı yok.</p>
          ) : agendaGroups.map(([day, items]) => (
            <div key={day} className="roomio-card" style={{ padding: 16 }}>
              <h3 className="roomio-card-title">{day}</h3>
              <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
                {items.map((r) => (
                  <li key={r.id} style={{ marginBottom: 8 }}>
                    <strong>{r.due}</strong> — Oda {r.roomNo} {r.guest}: {r.subject}
                    {' '}<span className="roomio-badge">{r.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.complaints.col.guest')}</th>
              <th>{t('gr.complaints.col.room')}</th>
              <th>{t('gr.traces.subject')}</th>
              <th>{t('gr.traces.due')}</th>
              {showNotesCol ? <th>Not</th> : null}
              <th>{t('gr.complaints.col.status')}</th>
              <th>{t('gr.traces.assignee')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={showNotesCol ? 9 : 8}>{t('reception.loading')}</td></tr>
            ) : filteredTraces.length === 0 ? (
              <tr><td colSpan={showNotesCol ? 9 : 8}>{t('gr.traces.empty')}</td></tr>
            ) : (
              filteredTraces.map((r) => (
                <tr key={r.id} className={traceKind(r) === 'yellow' ? 'roomio-row-warn' : ''}>
                  <td>{r.date}</td>
                  <td>{r.guest}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.subject}</td>
                  <td>{r.due}</td>
                  {showNotesCol ? <td>{r.notes?.replace(/^type:\w+\s*/, '') || '—'}</td> : null}
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
        <TableFooter total={filteredTraces.length} />
      </div>
      )}
    </>
  );
}
