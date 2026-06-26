'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { DEMO_HK_TASKS, HK_TASK_LABELS, type HkTask } from '@/lib/data/housekeeping';
import { loadControlArchive, defaultChecklistItems, type HkControlRecord } from '@/lib/housekeeping/control-archive';
import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

function buildChecklistFromBoard(rooms: HousekeepingBoardRow[]): HkTask[] {
  const fromBoard = rooms
    .filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT')
    .slice(0, 12)
    .map((r, i) => ({
      id: `live-${r.roomNo}`,
      roomNo: r.roomNo,
      taskType: r.status === 'DIRTY' ? ('checkout' as const) : ('stayover' as const),
      priority: r.status === 'DIRTY' ? ('urgent' as const) : ('normal' as const),
      assignee: r.assignedTo ?? 'Atanmadı',
      status: 'pending' as const,
      dueBy: `${10 + (i % 6)}:00`,
    }));
  return [...fromBoard, ...DEMO_HK_TASKS.filter((t) => t.status !== 'done')];
}

export function HkChecklistPanel() {
  const [tasks, setTasks] = useState<HkTask[]>(DEMO_HK_TASKS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/housekeeping/rooms');
      if (res.ok) {
        const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
        setTasks(buildChecklistFromBoard(data.rooms));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = tasks.filter((t) => t.status !== 'done');

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Housekeeper kontrol listesi</h2>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Oda</th><th>Görev</th><th>Öncelik</th><th>Personel</th><th>Saat</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {pending.length === 0 ? (
            <tr><td colSpan={6} className="roomio-table-empty">Bekleyen görev yok.</td></tr>
          ) : pending.map((t) => (
            <tr key={t.id}>
              <td><strong>{t.roomNo}</strong></td>
              <td>{HK_TASK_LABELS[t.taskType]}</td>
              <td>{t.priority === 'urgent' ? <span className="roomio-badge roomio-text-warn">Acil</span> : 'Normal'}</td>
              <td>{t.assignee}</td>
              <td>{t.dueBy}</td>
              <td><span className="roomio-badge">{t.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
        <Link href="/housekeeping/rooms?tab=control">Oda kontrol ekranı</Link>
        {' · '}
        <Link href="/housekeeping/operations">Operasyon merkezi</Link>
      </p>
    </div>
  );
}

export function HkControlArchivePanel() {
  const [records, setRecords] = useState<HkControlRecord[]>([]);

  useEffect(() => {
    setRecords(loadControlArchive());
  }, []);

  const passed = useMemo(() => records.filter((r) => r.result === 'pass').length, [records]);

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Oda kontrol arşivi</h2>
        <span className="roomio-badge">{passed}/{records.length} geçti</span>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Tarih</th><th>Oda</th><th>Kontrol eden</th><th>Sonuç</th><th>Maddeler</th><th>Not</th></tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={6} className="roomio-table-empty">
                Arşiv boş. <Link href="/housekeeping/rooms?tab=control" className="roomio-link">Oda kontrolü</Link> yapın.
              </td>
            </tr>
          ) : records.map((r) => (
            <tr key={r.id}>
              <td>{r.checkedAt.slice(0, 16).replace('T', ' ')}</td>
              <td><strong>{r.roomNo}</strong></td>
              <td>{r.inspector}</td>
              <td>
                <span className={`roomio-badge roomio-badge--${r.result === 'pass' ? 'ok' : 'muted'}`}>
                  {r.result === 'pass' ? 'Geçti' : 'Kaldı'}
                </span>
              </td>
              <td>{r.itemsChecked.length}/{defaultChecklistItems().length}</td>
              <td>{r.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
