'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RoomContextMenu,
  type RoomContextMenuState,
  type RoomMenuAction,
} from '@/components/reception/RoomContextMenu';
import { patchHkRoomFields } from '@/lib/client/hk-patch';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import {
  getCheckInCandidate,
  getInHouseReservation,
} from '@/lib/client/room-rack-reservation';
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
  onRefresh?: () => void;
  onSelectCell?: (cell: RackCell) => void;
};

export function useRoomRackContextMenu({
  reservations,
  businessDate,
  onRefresh,
  onSelectCell,
}: Options) {
  const router = useRouter();
  const [menu, setMenu] = useState<RoomContextMenuState>(null);
  const [busy, setBusy] = useState(false);

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

      if (action.type === 'checkInInfo') {
        const target = menu.arrival ?? menu.inHouse;
        if (target) {
          router.push(`/reception/guest/${target.id}`);
          closeMenu();
        }
        return;
      }

      if (action.type === 'folio') {
        if (menu.inHouse) {
          router.push(`/reception/guest/${menu.inHouse.id}?tab=folio`);
          closeMenu();
        }
        return;
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
    [menu, closeMenu, onRefresh, onSelectCell, router],
  );

  const menuNode = (
    <RoomContextMenu menu={menu} busy={busy} onAction={(a) => void handleAction(a)} onClose={closeMenu} />
  );

  return { openMenu, menuNode, closeMenu };
}
