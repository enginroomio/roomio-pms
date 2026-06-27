'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { QueueRoomPriority, QueueRoomRecord } from '@/lib/server/queue-rooms-service';

const PRIORITY_LABEL: Record<QueueRoomPriority, string> = {
  normal: 'Normal',
  vip: 'VIP',
  urgent: 'Acil',
};

function statusLabel(status: QueueRoomRecord['status']): string {
  if (status === 'waiting') return 'Bekliyor';
  if (status === 'ready') return 'Oda hazır';
  if (status === 'assigned') return 'Atandı';
  return 'İptal';
}

function statusClass(status: QueueRoomRecord['status']): string {
  if (status === 'ready') return 'roomio-pill roomio-pill--ok';
  if (status === 'waiting') return 'roomio-pill roomio-pill--warn';
  if (status === 'assigned') return 'roomio-pill';
  return 'roomio-pill roomio-pill--muted';
}

export function QueueRoomsPanel() {
  const [entries, setEntries] = useState<QueueRoomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    guestName: '',
    roomType: 'DBL',
    adults: 2,
    priority: 'normal' as QueueRoomPriority,
    notes: '',
    roomNo: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/reception/queue-rooms?status=active');
      const j = (await res.json()) as { entries?: QueueRoomRecord[] };
      setEntries(j.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await roomioFetch('/api/reception/queue-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function enqueue() {
    if (!form.guestName.trim()) return;
    await post({
      guestName: form.guestName.trim(),
      roomType: form.roomType,
      adults: form.adults,
      priority: form.priority,
      notes: form.notes || undefined,
    });
    setForm((p) => ({ ...p, guestName: '', notes: '', roomNo: '' }));
  }

  return (
    <div className="roomio-stack">
      <div className="roomio-card" style={{ padding: 16 }}>
        <h2 className="roomio-card-title">Kuyruğa Ekle</h2>
        <p className="roomio-page-desc">
          Opera / Protel PMS Mobile tarzı oda bekleme kuyruğu — oda hazır olana kadar misafiri takip edin.
        </p>
        <div className="roomio-form-grid" style={{ marginTop: 12 }}>
          <label className="roomio-field">
            <span>Misafir</span>
            <input className="roomio-input" value={form.guestName} onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>Oda tipi</span>
            <select className="roomio-input" value={form.roomType} onChange={(e) => setForm((p) => ({ ...p, roomType: e.target.value }))}>
              <option value="SGL">SGL</option>
              <option value="DBL">DBL</option>
              <option value="SUI">SUI</option>
            </select>
          </label>
          <label className="roomio-field">
            <span>Kişi</span>
            <input className="roomio-input" type="number" min={1} value={form.adults} onChange={(e) => setForm((p) => ({ ...p, adults: Number(e.target.value) }))} />
          </label>
          <label className="roomio-field">
            <span>Öncelik</span>
            <select className="roomio-input" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as QueueRoomPriority }))}>
              <option value="normal">Normal</option>
              <option value="vip">VIP</option>
              <option value="urgent">Acil</option>
            </select>
          </label>
          <label className="roomio-field" style={{ gridColumn: '1 / -1' }}>
            <span>Not</span>
            <input className="roomio-input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Erken giriş, bebek yatağı…" />
          </label>
        </div>
        <div className="roomio-form-actions">
          <Button onClick={() => void enqueue()} disabled={busy || !form.guestName.trim()}>Kuyruğa al</Button>
          <Button variant="secondary" onClick={() => void load()} disabled={busy}>Yenile</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Misafir</th>
              <th>Tip</th>
              <th>Öncelik</th>
              <th>Bekleme</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Yükleniyor…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6}>Aktif kuyruk kaydı yok.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.guestName}</strong>
                    {e.refNo ? <div className="roomio-page-desc">{e.refNo}</div> : null}
                  </td>
                  <td>{e.roomType} · {e.adults} kişi</td>
                  <td>{PRIORITY_LABEL[e.priority]}</td>
                  <td>{e.waitMinutes} dk</td>
                  <td><span className={statusClass(e.status)}>{statusLabel(e.status)}</span></td>
                  <td>
                    <div className="roomio-form-actions" style={{ margin: 0 }}>
                      {e.status === 'waiting' ? (
                        <Button variant="secondary" disabled={busy} onClick={() => void post({ action: 'ready', id: e.id })}>
                          Oda hazır
                        </Button>
                      ) : null}
                      {e.status === 'ready' ? (
                        <>
                          <input
                            className="roomio-input"
                            style={{ width: 72 }}
                            placeholder="Oda"
                            value={form.roomNo}
                            onChange={(ev) => setForm((p) => ({ ...p, roomNo: ev.target.value }))}
                          />
                          <Button
                            disabled={busy || !form.roomNo.trim()}
                            onClick={() => void post({ action: 'assign', id: e.id, roomNo: form.roomNo.trim() })}
                          >
                            Ata
                          </Button>
                        </>
                      ) : null}
                      <Button variant="ghost" disabled={busy} onClick={() => void post({ action: 'cancel', id: e.id })}>
                        İptal
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
