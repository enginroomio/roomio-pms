'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BedDouble, ClipboardList, LayoutGrid } from 'lucide-react';
import { HousekeepingPano } from '@/components/housekeeping/HousekeepingPano';
import { HkPushRegister } from '@/components/housekeeping/HkPushRegister';
import { HkOnlinePanel } from '@/components/housekeeping/HkOnlinePanel';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert, HK_PUSH_ALERT_EVENT, type HkPushAlertDetail } from '@/lib/client/hk-push-alert';
import { patchHkRoom } from '@/lib/client/hk-update';
import { roomioFetch } from '@/lib/client/api';
import { enqueueSync } from '@/lib/sync/engine';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

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
    const showAlert = (detail: HkPushAlertDetail) => {
      setPushAlert(detail);
      void showHkBrowserNotification(detail.body, detail.title);
      window.setTimeout(() => setPushAlert(null), 10_000);
    };

    const onDomAlert = (event: Event) => {
      const detail = (event as CustomEvent<HkPushAlertDetail>).detail;
      if (detail?.body) showAlert(detail);
    };

    window.addEventListener(HK_PUSH_ALERT_EVENT, onDomAlert);

    if (!('serviceWorker' in navigator)) {
      return () => window.removeEventListener(HK_PUSH_ALERT_EVENT, onDomAlert);
    }

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
        showAlert({
          title: data.payload.title ?? 'Roomio HK',
          body: data.payload.body,
        });
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
    return () => {
      window.removeEventListener(HK_PUSH_ALERT_EVENT, onDomAlert);
      navigator.serviceWorker.removeEventListener('message', handler);
    };
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
    <>
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
        <HkOnlinePanel compact />

        <HousekeepingPano
          board={board}
          selectedFloor={floor}
          onFloorChange={setFloor}
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
          onStatusChange={(roomNo, status) => void updateStatus(roomNo, status)}
          savingRoom={savingRoom}
          variant="mobile"
        />

        <nav className="roomio-hk-mobile__nav" aria-label="HK mobil menü">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="roomio-hk-mobile__nav-item">
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
    </>
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

  if (!board) return <div className="roomio-hk-mobile-shell roomio-hk-mobile--loading">Yükleniyor…</div>;
  return <HousekeepingMobileClient initialBoard={board} />;
}
