'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import {
  HkFilterBar,
  HkStatusDots,
  HkToolbar,
  HousekeepingPano,
} from '@/components/housekeeping/HousekeepingPano';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { patchHkRoom } from '@/lib/client/hk-update';
import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

type HubProps = {
  initialBoard: HousekeepingBoardRow[];
};

export function HousekeepingHubClient({ initialBoard }: HubProps) {
  const [board, setBoard] = useState(initialBoard);
  const [floor, setFloor] = useState<number | 'ALL'>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [savingRoom, setSavingRoom] = useState<string | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const updateStatus = useCallback(async (roomNo: string, status: HousekeepingBoardRow['status']) => {
    setSavingRoom(roomNo);
    try {
      const result = await patchHkRoom(roomNo, status);
      if (!result.ok) throw new Error('Güncellenemedi');
      setBoard((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, status } : r)));
    } finally {
      setSavingRoom(null);
    }
  }, []);

  return (
    <HousekeepingPano
      board={board}
      selectedFloor={floor}
      onFloorChange={setFloor}
      selectedRoom={selectedRoom}
      onRoomSelect={setSelectedRoom}
      onStatusChange={(roomNo, status) => void updateStatus(roomNo, status)}
      savingRoom={savingRoom}
    />
  );
}

export function HousekeepingRoomsClient() {
  const [rooms, setRooms] = useState<HousekeepingBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floor, setFloor] = useState<number | 'ALL'>('ALL');
  const [status, setStatus] = useState<HousekeepingBoardRow['status'] | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [savingRoom, setSavingRoom] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/housekeeping/rooms');
      if (!res.ok) throw new Error('Oda durumları yüklenemedi');
      const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
      setRooms(data.rooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const filtered = useMemo(() => {
    let list = rooms;
    if (floor !== 'ALL') list = list.filter((r) => r.floor === floor);
    if (status !== 'ALL') list = list.filter((r) => r.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.roomNo.includes(q) || r.guestName?.toLowerCase().includes(q));
    }
    return list;
  }, [rooms, floor, status, search]);

  async function updateStatus(roomNo: string, next: HousekeepingBoardRow['status']) {
    setSavingRoom(roomNo);
    try {
      const result = await patchHkRoom(roomNo, next);
      if (!result.ok) throw new Error('Durum güncellenemedi');
      setRooms((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, status: next } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme hatası');
    } finally {
      setSavingRoom(null);
    }
  }

  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri > Oda Durumu"
      title="Oda Listesi"
      description="Elektra screen-101 uyumlu — 77 oda, HK durum matrisi, misafir ve tarih."
    >
      <HousekeepingTabs />
      <HkFilterBar
        floor={floor}
        status={status}
        onFloor={setFloor}
        onStatus={setStatus}
        search={search}
        onSearch={setSearch}
      />

      <div className="roomio-card roomio-table-wrap roomio-hk-table-card">
        <HkToolbar total={filtered.length} onRefresh={() => void loadRooms()} />
        {error ? <p className="roomio-page-desc roomio-text-warn">{error}</p> : null}
        <table className="roomio-table roomio-hk-table">
          <thead>
            <tr>
              <th>Oda No</th>
              <th>Kat</th>
              <th>Tip</th>
              <th colSpan={3}>HK Durumu</th>
              <th>Misafir</th>
              <th>Giriş / Çıkış</th>
              <th>Personel / Durum</th>
            </tr>
            <tr className="roomio-hk-table__subhead">
              <th colSpan={3} />
              <th>Temiz</th>
              <th>Kirli</th>
              <th>Kontrol</th>
              <th colSpan={3} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>Yükleniyor…</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.floor}. Kat</td>
                <td>{r.type}</td>
                <td colSpan={3}><HkStatusDots status={r.status} /></td>
                <td>{r.guestName ?? '—'}</td>
                <td>{formatDate(r.checkIn)} / {formatDate(r.checkOut)}</td>
                <td>
                  <div className="roomio-hk-table__staff">
                    <span>{r.assignedTo ?? '—'}</span>
                    <select
                      className="roomio-select roomio-select--compact"
                      value={r.status}
                      disabled={savingRoom === r.roomNo}
                      onChange={(e) => void updateStatus(r.roomNo, e.target.value as HousekeepingBoardRow['status'])}
                      aria-label={`Oda ${r.roomNo} durumu`}
                    >
                      {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
                        <option key={s} value={s}>{HK_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="roomio-hk-table__foot">
          <span>1 – {filtered.length} / {rooms.length}</span>
        </div>
      </div>
    </PageHeader>
  );
}
