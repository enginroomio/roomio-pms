'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BedDouble, ClipboardList, LayoutGrid } from 'lucide-react';
import { HousekeepingPano } from '@/components/housekeeping/HousekeepingPano';
import { HkPushRegister } from '@/components/housekeeping/HkPushRegister';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { patchHkRoom } from '@/lib/client/hk-update';
import { roomioFetch } from '@/lib/client/api';
import { enqueueSync } from '@/lib/sync/engine';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import '@/app/styles/hk-mobile.css';

const NAV = [
  { href: '/housekeeping/mobile', label: 'Pano', icon: LayoutGrid },
  { href: '/housekeeping/rooms', label: 'Liste', icon: BedDouble },
  { href: '/housekeeping/tasks', label: 'Görev', icon: ClipboardList },
];

export function HousekeepingMobileClient({ initialBoard }: { initialBoard: HousekeepingBoardRow[] }) {
  const [board, setBoard] = useState(initialBoard);
  const [floor, setFloor] = useState<number | 'ALL'>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [pushAlert, setPushAlert] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        payload?: {
          roomNo?: string;
          hkStatus?: HousekeepingBoardRow['status'];
          title?: string;
          body?: string;
          tag?: string;
        };
      };

      if (data?.type === 'roomio-hk-push' && data.payload?.body) {
        const title = data.payload.title ?? 'Roomio HK';
        const body = data.payload.body;
        setPushAlert({ title, body });
        void showHkBrowserNotification(body, title);
        window.setTimeout(() => setPushAlert(null), 10_000);
        return;
      }

      if (data?.type !== 'roomio-hk-offline' || !data.payload?.roomNo || !data.payload.hkStatus) return;
      void enqueueSync({
        entity: 'housekeeping',
        operation: 'update',
        entityId: data.payload.roomNo,
        payload: { roomNo: data.payload.roomNo, hkStatus: data.payload.hkStatus },
      }).then(() => setQueuedCount((n) => n + 1));
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const updateStatus = useCallback(async (roomNo: string, status: HousekeepingBoardRow['status']) => {
    setSavingRoom(roomNo);
    try {
      const result = await patchHkRoom(roomNo, status);
      setBoard((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, status } : r)));
      if (result.queued) setQueuedCount((n) => n + 1);
    } finally {
      setSavingRoom(null);
    }
  }, []);

  return (
    <div className="roomio-hk-mobile">
      {pushAlert ? (
        <div className="roomio-hk-push-alert" role="status">
          <strong>{pushAlert.title}</strong>
          <span>{pushAlert.body}</span>
          <button type="button" onClick={() => setPushAlert(null)} aria-label="Kapat">
            ×
          </button>
        </div>
      ) : null}
      <header className="roomio-hk-mobile__header">
        <div>
          <p className="roomio-hk-mobile__eyebrow">Kat Hizmetleri</p>
          <h1>HK Mobil</h1>
        </div>
        {queuedCount > 0 ? (
          <span className="roomio-hk-mobile__badge">{queuedCount} kuyruk</span>
        ) : null}
        <HkPushRegister />
      </header>

      <HousekeepingPano
        board={board}
        selectedFloor={floor}
        onFloorChange={setFloor}
        selectedRoom={selectedRoom}
        onRoomSelect={setSelectedRoom}
        onStatusChange={(roomNo, status) => void updateStatus(roomNo, status)}
        savingRoom={savingRoom}
      />

      <nav className="roomio-hk-mobile__nav" aria-label="HK mobil menü">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="roomio-hk-mobile__nav-item">
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function HousekeepingMobileLoader() {
  const [board, setBoard] = useState<HousekeepingBoardRow[] | null>(null);

  useEffect(() => {
    void roomioFetch('/api/housekeeping/rooms')
      .then((res) => res.json())
      .then((data: { rooms: HousekeepingBoardRow[] }) => setBoard(data.rooms))
      .catch(() => setBoard([]));
  }, []);

  if (!board) return <div className="roomio-hk-mobile roomio-hk-mobile--loading">Yükleniyor…</div>;
  return <HousekeepingMobileClient initialBoard={board} />;
}
