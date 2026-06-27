'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { patchHkRoom } from '@/lib/client/hk-update';
import { roomioFetch } from '@/lib/client/api';
import {
  defaultChecklistItems,
  saveControlRecord,
  type HkControlRecord,
} from '@/lib/housekeeping/control-archive';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

export function HkRoomControlPanel() {
  const [rooms, setRooms] = useState<HousekeepingBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [inspector, setInspector] = useState('Süpervizör');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => defaultChecklistItems(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/housekeeping/rooms');
      if (!res.ok) throw new Error('Odalar yüklenemedi');
      const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
      setRooms(data.rooms);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inspectQueue = useMemo(
    () => rooms.filter((r) => r.status === 'INSPECT' || r.status === 'DIRTY'),
    [rooms],
  );

  const room = selected ? rooms.find((r) => r.roomNo === selected) : null;

  function toggleItem(item: string) {
    setChecks((c) => ({ ...c, [item]: !c[item] }));
  }

  async function submitControl(pass: boolean) {
    if (!room) return;
    setBusy(true);
    setMsg(null);
    const checkedItems = items.filter((i) => checks[i]);
    const record: HkControlRecord = {
      id: `hkc-${Date.now()}`,
      roomNo: room.roomNo,
      inspector,
      checkedAt: new Date().toISOString(),
      result: pass ? 'pass' : 'fail',
      notes: notes.trim() || undefined,
      itemsChecked: checkedItems,
    };
    try {
      const nextStatus = pass ? 'CLEAN' : 'DIRTY';
      const result = await patchHkRoom(room.roomNo, nextStatus);
      if (!result.ok) throw new Error('Durum güncellenemedi');
      saveControlRecord(record);
      setRooms((prev) => prev.map((r) => (r.roomNo === room.roomNo ? { ...r, status: nextStatus } : r)));
      setSelected(null);
      setChecks({});
      setNotes('');
      setMsg(pass ? `Oda ${room.roomNo} kontrol geçti — temiz.` : `Oda ${room.roomNo} tekrar kirli işaretlendi.`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card roomio-table-wrap">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Kontrol kuyruğu</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
        </div>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Oda</th><th>Kat</th><th>Tip</th><th>Durum</th><th>Personel</th><th /></tr>
          </thead>
          <tbody>
            {inspectQueue.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Kontrol bekleyen oda yok.</td></tr>
            ) : inspectQueue.map((r) => (
              <tr key={r.id} className={selected === r.roomNo ? 'roomio-row-selected' : ''}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.floor}</td>
                <td>{r.type}</td>
                <td><span className="roomio-badge">{HK_STATUS_LABELS[r.status]}</span></td>
                <td>{r.assignedTo ?? '—'}</td>
                <td>
                  <Button variant={selected === r.roomNo ? 'primary' : 'ghost'} onClick={() => setSelected(r.roomNo)}>
                    Kontrol et
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {room ? (
        <div className="roomio-card" style={{ padding: 20 }}>
          <h2 className="roomio-card-title">Oda {room.roomNo} — kontrol listesi</h2>
          <label className="roomio-field" style={{ marginTop: 12 }}>
            <span>Kontrol eden</span>
            <input className="roomio-input" value={inspector} onChange={(e) => setInspector(e.target.value)} />
          </label>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
            {items.map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={!!checks[item]} onChange={() => toggleItem(item)} />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          <label className="roomio-field" style={{ marginTop: 12 }}>
            <span>Not</span>
            <input className="roomio-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel" />
          </label>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button disabled={busy} onClick={() => void submitControl(true)}>Geçti — Temiz</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void submitControl(false)}>Kaldı — Kirli</Button>
          </div>
        </div>
      ) : null}

      {msg ? <p className="roomio-page-desc" role="status" style={{ gridColumn: '1 / -1' }}>{msg}</p> : null}
    </div>
  );
}
