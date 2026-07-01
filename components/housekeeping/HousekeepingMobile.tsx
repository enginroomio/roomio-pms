'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DailyMovements } from '@/components/DailyMovements';
import { DashboardRoomRack } from '@/components/DashboardRoomRack';
import { HkMobileKpiStrip } from '@/components/housekeeping/HkMobileKpiStrip';
import { HkMobileNav } from '@/components/housekeeping/HkMobileNav';
import { HkPushRegister } from '@/components/housekeeping/HkPushRegister';
import { HkRoomContextMenu, type HkRoomMenuState } from '@/components/housekeeping/HkRoomContextMenu';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert, HK_PUSH_ALERT_EVENT, type HkPushAlertDetail } from '@/lib/client/hk-push-alert';
import { roomioFetch } from '@/lib/client/api';
import { emitHkMapUpdate } from '@/lib/client/hk-map-sync';
import { emitFaultClientUpdate, useLiveFaults } from '@/lib/client/use-live-faults';
import { patchHkRoom } from '@/lib/client/hk-update';
import { useLiveHkMap } from '@/lib/client/use-live-hk-map';
import { buildHkMobileAlerts } from '@/lib/housekeeping/alerts';
import { enqueueSync } from '@/lib/sync/engine';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { Reservation } from '@/lib/types/reservation';
import { HK_STATUS_LABELS, type RoomHkStatus } from '@/lib/types/room';
import { useI18n } from '@/components/i18n/I18nProvider';

export type HkMobileSnapshot = {
  businessDate: string;
  reservations: Reservation[];
  hkMap: Record<string, HkRoomRecord>;
  arrivals: Reservation[];
  departures: Reservation[];
  alerts: { label: string; count: number; href?: string }[];
};

export function HousekeepingMobileClient({ snapshot }: { snapshot: HkMobileSnapshot }) {
  const { t } = useI18n();
  const { hkMap, applyUpdate } = useLiveHkMap(snapshot.hkMap);
  const { openFaultForRoom, removeFault } = useLiveFaults();
  const [queuedCount, setQueuedCount] = useState(0);
  const [pushAlert, setPushAlert] = useState<{ title: string; body: string } | null>(null);
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [roomMenu, setRoomMenu] = useState<HkRoomMenuState>(null);
  const lastLocalPatch = useRef<{ roomNo: string; status: string; at: number } | null>(null);

  const alerts = useMemo(
    () => buildHkMobileAlerts(hkMap, snapshot.departures.length),
    [hkMap, snapshot.departures.length],
  );

  const notifyStatusChange = useCallback((roomNo: string, status: HousekeepingBoardRow['status']) => {
    const hkStatus = status as RoomHkStatus;
    const label = HK_STATUS_LABELS[hkStatus] ?? status;
    lastLocalPatch.current = { roomNo, status: hkStatus, at: Date.now() };
    emitHkPushAlert({
      title: t('hk.mobile.room', { room: roomNo }),
      body: t('hk.mobile.statusUpdated', { label }),
    });
  }, [t]);

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
        const { title, body, roomNo, hkStatus } = data.payload;
        const echo = lastLocalPatch.current;
        const isEcho =
          Boolean(echo) &&
          echo?.roomNo === roomNo &&
          echo?.status === hkStatus &&
          Date.now() - (echo?.at ?? 0) < 5000;
        if (!isEcho) {
          showAlert({
            title: title ?? 'Roomio HK',
            body,
          });
        }
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
      applyUpdate(roomNo, status as RoomHkStatus);
      const result = await patchHkRoom(roomNo, status);
      if (status === 'OOO') {
        emitFaultClientUpdate({ action: 'created', roomNo });
      } else if (status === 'CLEAN') {
        const fault = openFaultForRoom(roomNo);
        if (fault) {
          removeFault(fault.id);
          emitFaultClientUpdate({ action: 'completed', roomNo, faultId: fault.id });
        }
      }
      notifyStatusChange(roomNo, status);
      if (result.queued) setQueuedCount((n) => n + 1);
      setRoomMenu(null);
    } finally {
      setSavingRoom(null);
    }
  }, [applyUpdate, notifyStatusChange, openFaultForRoom, removeFault]);

  const completeFault = useCallback(async (roomNo: string, faultId: string) => {
    setSavingRoom(roomNo);
    try {
      const res = await roomioFetch('/api/housekeeping/faults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faultId, action: 'complete', resolvedBy: 'HK' }),
      });
      if (!res.ok) throw new Error('Arıza kapatılamadı');
      applyUpdate(roomNo, 'CLEAN');
      emitHkMapUpdate({ roomNo, hkStatus: 'CLEAN' });
      removeFault(faultId);
      emitFaultClientUpdate({ action: 'completed', roomNo, faultId });
      notifyStatusChange(roomNo, 'CLEAN');
      setRoomMenu(null);
    } finally {
      setSavingRoom(null);
    }
  }, [applyUpdate, notifyStatusChange, removeFault]);

  const openRoomMenu = useCallback(
    (roomNo: string, event: React.MouseEvent) => {
      const raw = hkMap[roomNo]?.hkStatus ?? 'CLEAN';
      const current: HousekeepingBoardRow['status'] =
        raw === 'OOS' ? 'OOO' : (raw as HousekeepingBoardRow['status']);
      const fault = openFaultForRoom(roomNo);
      setRoomMenu({
        roomNo,
        x: event.clientX,
        y: event.clientY,
        currentStatus: current,
        openFaultId: fault?.id,
      });
    },
    [hkMap, openFaultForRoom],
  );

  return (
    <>
      {pushAlert ? (
        <div className="roomio-hk-push-alert" role="status">
          <strong>{pushAlert.title}</strong>
          <span>{pushAlert.body}</span>
          <button type="button" onClick={() => setPushAlert(null)} aria-label={t('hk.mobile.close')}>
            ×
          </button>
        </div>
      ) : null}

      <header className="roomio-hk-mobile__header roomio-hk-mobile__header--compact">
        <h1>{t('hk.mobile.title')}</h1>
        {queuedCount > 0 ? (
          <span className="roomio-hk-mobile__badge">{t('hk.mobile.queue', { count: queuedCount })}</span>
        ) : null}
        <HkPushRegister />
      </header>

      <HkMobileKpiStrip reservations={snapshot.reservations} hkMap={hkMap} />

      <div className="roomio-dashboard-board roomio-hk-dashboard-board">
        <div className="roomio-dashboard-rack">
          <DashboardRoomRack
            reservations={snapshot.reservations}
            businessDate={snapshot.businessDate}
            hkMap={hkMap}
            hkInteractive={true}
            hkPrimary={true}
            savingRoom={savingRoom}
            onRoomContextMenu={openRoomMenu}
          />
        </div>
        <DailyMovements
          arrivals={snapshot.arrivals}
          departures={snapshot.departures}
          alerts={alerts}
          maskGuestNames
          compact
        />
      </div>

      <HkMobileNav />

      <HkRoomContextMenu
        menu={roomMenu}
        savingRoom={savingRoom}
        onSelect={(roomNo, status) => void updateStatus(roomNo, status)}
        onCompleteFault={(roomNo, faultId) => void completeFault(roomNo, faultId)}
        onClose={() => setRoomMenu(null)}
      />
    </>
  );
}
