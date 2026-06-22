'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BedDouble, ClipboardList, LayoutGrid } from 'lucide-react';
import { DailyMovements } from '@/components/DailyMovements';
import { DashboardRoomRack } from '@/components/DashboardRoomRack';
import { HkPushRegister } from '@/components/housekeeping/HkPushRegister';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { HK_PUSH_ALERT_EVENT, type HkPushAlertDetail } from '@/lib/client/hk-push-alert';
import { enqueueSync } from '@/lib/sync/engine';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { Reservation } from '@/lib/types/reservation';

const NAV = [
  { href: '/housekeeping/mobile', label: 'Pano', icon: LayoutGrid },
  { href: '/housekeeping/rooms', label: 'Liste', icon: BedDouble },
  { href: '/housekeeping/tasks', label: 'Görev', icon: ClipboardList },
];

export type HkMobileSnapshot = {
  businessDate: string;
  reservations: Reservation[];
  hkMap: Record<string, HkRoomRecord>;
  arrivals: Reservation[];
  departures: Reservation[];
  alerts: { label: string; count: number; href?: string }[];
};

export function HousekeepingMobileClient({ snapshot }: { snapshot: HkMobileSnapshot }) {
  const [queuedCount, setQueuedCount] = useState(0);
  const [pushAlert, setPushAlert] = useState<{ title: string; body: string } | null>(null);

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

      <header className="roomio-hk-mobile__header roomio-hk-mobile__header--compact">
        <h1>Oda Rack</h1>
        {queuedCount > 0 ? (
          <span className="roomio-hk-mobile__badge">{queuedCount} kuyruk</span>
        ) : null}
        <HkPushRegister />
      </header>

      <div className="roomio-dashboard-board roomio-hk-dashboard-board">
        <div className="roomio-dashboard-rack">
          <DashboardRoomRack
            reservations={snapshot.reservations}
            businessDate={snapshot.businessDate}
            hkMap={snapshot.hkMap}
          />
        </div>
        <DailyMovements
          arrivals={snapshot.arrivals}
          departures={snapshot.departures}
          alerts={snapshot.alerts}
          maskGuestNames
          compact
        />
      </div>

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
