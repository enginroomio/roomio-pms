'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RoomContextMenu,
  type RoomContextMenuState,
  type RoomMenuAction,
} from '@/components/reception/RoomContextMenu';
import { RackRoomCoordinatesDialog } from '@/components/reception/RackRoomCoordinatesDialog';
import { patchHkRoomFields } from '@/lib/client/hk-patch';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { dispatchRackDisplayAction } from '@/lib/client/rack-display-actions';
import { updateRackPreferences } from '@/lib/client/rack-preferences';
import { useRackPreferences } from '@/lib/client/use-rack-preferences';
import {
  getCheckInCandidate,
  getInHouseReservation,
  resolveCheckOutHref,
  resolveWalkInCheckInHref,
} from '@/lib/client/room-rack-reservation';
import type { RackDisplayContext } from '@/lib/rooms/rack-display';
import type { RackCell, RoomHkStatus } from '@/lib/types/room';
import type { Reservation } from '@/lib/types/reservation';

const HK_STATUS_ACTION: Record<'CLEAN' | 'DIRTY' | 'OOO' | 'OOS', RoomHkStatus> = {
  CLEAN: 'CLEAN',
  DIRTY: 'DIRTY',
  OOO: 'OOO',
  OOS: 'OOS',
};

type Options = {
  reservations: Reservation[];
  businessDate: string;
  displayCtx?: RackDisplayContext;
  onRefresh?: () => void;
  onSelectCell?: (cell: RackCell) => void;
};

export function useRoomRackContextMenu({
  reservations,
  businessDate,
  displayCtx,
  onRefresh,
  onSelectCell,
}: Options) {
  const router = useRouter();
  const { prefs } = useRackPreferences();
  const [menu, setMenu] = useState<RoomContextMenuState>(null);
  const [coordsCell, setCoordsCell] = useState<RackCell | null>(null);
  const [busy, setBusy] = useState(false);

  const rackDisplayCtx = useMemo(
    () => displayCtx ?? { businessDate, reservations },
    [displayCtx, businessDate, reservations],
  );

  const openMenu = useCallback(
    (cell: RackCell, event: React.MouseEvent) => {
      const roomNo = cell.room.roomNo;
      setMenu({
        cell,
        x: event.clientX,
        y: event.clientY,
        inHouse: getInHouseReservation(roomNo, reservations),
        arrival: getCheckInCandidate(roomNo, reservations, businessDate),
      });
    },
    [reservations, businessDate],
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const handleAction = useCallback(
    async (action: RoomMenuAction) => {
      if (!menu) return;

      if (action.type === 'rackInfo') {
        onSelectCell?.(menu.cell);
        closeMenu();
        return;
      }

      if (action.type === 'roomCoordinates') {
        onSelectCell?.(menu.cell);
        setCoordsCell(menu.cell);
        closeMenu();
        return;
      }

      if (action.type === 'floorColor') {
        if (action.color) updateRackPreferences({ floorBg: action.color });
        else dispatchRackDisplayAction({ type: 'floorColor' });
        closeMenu();
        return;
      }

      if (action.type === 'changeView') {
        const nextView = prefs.viewMode === 'roomNo' ? 'type' : 'roomNo';
        updateRackPreferences({
          viewMode: nextView,
          previewDetail: !prefs.previewDetail,
        });
        closeMenu();
        return;
      }

      if (action.type === 'clearSort') {
        updateRackPreferences({ cellOrder: {} });
        dispatchRackDisplayAction({ type: 'clearSort' });
        closeMenu();
        return;
      }

      if (action.type === 'toggleDragDrop') {
        updateRackPreferences({ dragDrop: !prefs.dragDrop });
        closeMenu();
        return;
      }

      if (action.type === 'fixPositions') {
        updateRackPreferences({ fixPositions: !prefs.fixPositions });
        closeMenu();
        return;
      }

      if (action.type === 'checkIn') {
        const walkInHref = resolveWalkInCheckInHref(menu.cell, menu.arrival, businessDate);
        if (walkInHref) {
          router.push(walkInHref);
          closeMenu();
          return;
        }
      }

      if (action.type === 'checkOut') {
        const departHref = resolveCheckOutHref(menu.inHouse, menu.cell.room.roomNo);
        if (departHref) {
          router.push(departHref);
          closeMenu();
          return;
        }
      }

      setBusy(true);
      try {
        if (action.type === 'checkIn' && menu.arrival) {
          const r = menu.arrival;
          const res = await roomioFetch('/api/reception/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: r.id,
              roomNo: menu.cell.room.roomNo,
              guestName: r.guestName,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              reservationRef: r.refNo,
            }),
          });
          if (!res.ok) {
            window.alert(await parseApiError(res, 'Check-in başarısız'));
            return;
          }
          const json = (await res.json()) as { ok?: boolean; message?: string };
          if (!json.ok) {
            window.alert(json.message ?? 'Check-in başarısız');
            return;
          }
        }

        if (action.type === 'checkOut' && menu.inHouse) {
          const r = menu.inHouse;
          const res = await roomioFetch('/api/reception/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: r.id,
              roomNo: menu.cell.room.roomNo,
              guestName: r.guestName,
            }),
          });
          if (!res.ok) {
            window.alert(await parseApiError(res, 'Check-out başarısız'));
            return;
          }
          const json = (await res.json()) as { ok?: boolean; message?: string };
          if (!json.ok) {
            window.alert(json.message ?? 'Check-out başarısız');
            return;
          }
        }

        if (action.type === 'setStatus') {
          await patchHkRoomFields(menu.cell.room.roomNo, {
            hkStatus: HK_STATUS_ACTION[action.status],
          });
        }

        closeMenu();
        onRefresh?.();
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [menu, closeMenu, onRefresh, onSelectCell, router, businessDate, prefs],
  );

  const menuNode = (
    <>
      <RoomContextMenu
        menu={menu}
        busy={busy}
        rackPrefs={prefs}
        onAction={(a) => void handleAction(a)}
        onClose={closeMenu}
      />
      <RackRoomCoordinatesDialog
        cell={coordsCell}
        ctx={rackDisplayCtx}
        onClose={() => setCoordsCell(null)}
      />
    </>
  );

  return { openMenu, menuNode, closeMenu };
}
