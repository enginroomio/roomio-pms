'use client';

import { useCallback, useMemo, useState } from 'react';
import { DailyMovements } from '@/components/DailyMovements';
import { DashboardOpsBottom } from '@/components/dashboard/DashboardOpsBottom';
import { DashboardRoomRack } from '@/components/DashboardRoomRack';
import { DashboardWeatherWidget } from '@/components/dashboard/DashboardWeatherWidget';
import {
  HkRoomContextMenu,
  type HkRoomMenuState,
} from '@/components/housekeeping/HkRoomContextMenu';
import { useRoomRackContextMenu } from '@/components/reception/useRoomRackContextMenu';
import { patchHkRoom } from '@/lib/client/hk-update';
import { useLiveHkMap } from '@/lib/client/use-live-hk-map';
import { usePointerFine } from '@/lib/client/use-pointer-fine';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import { buildHkMobileAlerts } from '@/lib/housekeeping/alerts';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { Reservation } from '@/lib/types/reservation';
import type { RoomHkStatus } from '@/lib/types/room';

type Props = {
  reservations: Reservation[];
  businessDate: string;
  hkMap: Record<string, HkRoomRecord>;
  arrivals: Reservation[];
  departures: Reservation[];
};

/** Ana sayfa — canlı rack + uyarılar */
export function DashboardBoard({
  reservations,
  businessDate,
  hkMap: initialHkMap,
  arrivals,
  departures,
}: Props) {
  const pointerFine = usePointerFine();
  const { hkMap, applyUpdate } = useLiveHkMap(initialHkMap);
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [roomMenu, setRoomMenu] = useState<HkRoomMenuState>(null);
  const [rackStatus, setRackStatus] = useState<string | null>(null);

  const { openMenu: openPmsMenu, menuNode: pmsMenuNode } = useRoomRackContextMenu({
    reservations,
    businessDate,
    onSelectCell: (cell) => {
      const guest = cell.guestName ?? 'Boş';
      const suffix = cell.room.suffix;
      const corridor = suffix <= 9 ? 'Sol' : 'Sağ';
      setRackStatus(
        `${cell.room.roomNo} ${cell.state.toUpperCase()} · ${cell.room.typeShort} · ${guest} · ${cell.room.floor}. kat ${corridor} (${suffix})`,
      );
    },
  });

  const alerts = useMemo(
    () => buildHkMobileAlerts(hkMap, departures.length),
    [hkMap, departures.length],
  );

  const updateStatus = useCallback(async (roomNo: string, status: HousekeepingBoardRow['status']) => {
    setSavingRoom(roomNo);
    try {
      applyUpdate(roomNo, status as RoomHkStatus);
      await patchHkRoom(roomNo, status);
      setRoomMenu(null);
    } finally {
      setSavingRoom(null);
    }
  }, [applyUpdate]);

  const openRoomMenu = useCallback(
    (roomNo: string, event: React.MouseEvent) => {
      const raw = hkMap[roomNo]?.hkStatus ?? 'CLEAN';
      const current: HousekeepingBoardRow['status'] =
        raw === 'OOS' ? 'OOO' : (raw as HousekeepingBoardRow['status']);
      setRoomMenu({ roomNo, x: event.clientX, y: event.clientY, currentStatus: current });
    },
    [hkMap],
  );

  return (
    <>
      <div className="roomio-dashboard-board-wrap">
        <div className="roomio-dashboard-board">
          <div className="roomio-dashboard-rack">
            <DashboardRoomRack
              reservations={reservations}
              businessDate={businessDate}
              hkMap={hkMap}
              hkInteractive={pointerFine}
              savingRoom={savingRoom}
              onRoomContextMenu={openRoomMenu}
              onRoomPmsContextMenu={openPmsMenu}
            />
            {rackStatus ? (
              <div className="roomio-dashboard-rack-status" aria-live="polite">
                {rackStatus}
              </div>
            ) : null}
          </div>
          <aside className="roomio-dashboard-side">
            <DashboardWeatherWidget />
            <DailyMovements arrivals={arrivals} departures={departures} alerts={alerts} />
          </aside>
        </div>
        <DashboardOpsBottom
          hkMap={hkMap}
          onHkUpdate={(roomNo, status) => applyUpdate(roomNo, status)}
        />
      </div>

      <HkRoomContextMenu
        menu={roomMenu}
        savingRoom={savingRoom}
        onSelect={(roomNo, status) => void updateStatus(roomNo, status)}
        onClose={() => setRoomMenu(null)}
      />
      {pmsMenuNode}
    </>
  );
}
