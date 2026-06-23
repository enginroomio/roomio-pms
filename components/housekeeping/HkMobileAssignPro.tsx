'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  HkAssignProApp,
  type AssignRoom,
} from '@/components/housekeeping/mockups/HkAssignProMockup';
import { HkMobileNav } from '@/components/housekeeping/HkMobileNav';
import { downloadHkListCsv, printHkListPdf } from '@/lib/client/hk-list-export';
import { printStaffReportA4 } from '@/lib/client/hk-staff-report';
import { patchHkRoomAssign } from '@/lib/client/hk-update';
import { roomioFetch } from '@/lib/client/api';
import { HK_STAFF } from '@/lib/housekeeping/staff';
import { maskGuestName } from '@/lib/kvkk';
import type { RoomFault } from '@/lib/server/fault-service';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

function formatDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function boardRowToAssignRoom(r: HousekeepingBoardRow): AssignRoom {
  let priority: AssignRoom['priority'] = 'low';
  if (r.checkOut) priority = 'high';
  else if (r.checkIn) priority = 'med';

  let note = r.notes;
  if (r.checkOut && !note) note = `Çıkış ${formatDate(r.checkOut)}`;
  else if (r.checkIn && !note) note = `Giriş ${formatDate(r.checkIn)}`;

  return {
    roomNo: r.roomNo,
    floor: r.floor,
    status: r.status,
    guest: r.guestName ? maskGuestName(r.guestName) : undefined,
    note,
    assignee: r.assignedTo,
    priority,
  };
}

/** HK mobil — profesyonel atama ekranı */
export function HkMobileAssignProClient() {
  const [boardRows, setBoardRows] = useState<HousekeepingBoardRow[]>([]);
  const [rooms, setRooms] = useState<AssignRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [guestRequests, setGuestRequests] = useState<
    import('@/lib/server/guest-request-service').HkGuestRequestRecord[]
  >([]);
  const [faults, setFaults] = useState<RoomFault[]>([]);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, reqRes, faultRes] = await Promise.all([
        roomioFetch('/api/housekeeping/rooms'),
        roomioFetch('/api/housekeeping/requests?status=active'),
        roomioFetch('/api/housekeeping/faults?status=active'),
      ]);
      if (!res.ok) throw new Error('Oda durumları yüklenemedi');
      const data = (await res.json()) as { rooms: HousekeepingBoardRow[] };
      setBoardRows(data.rooms);
      setRooms(data.rooms.map(boardRowToAssignRoom));
      if (reqRes.ok) {
        const reqData = (await reqRes.json()) as {
          requests: import('@/lib/server/guest-request-service').HkGuestRequestRecord[];
        };
        setGuestRequests(reqData.requests);
      }
      if (faultRes.ok) {
        const faultData = (await faultRes.json()) as { faults: RoomFault[] };
        setFaults(faultData.faults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const persistAssign = useCallback(async (roomNos: string[], staffName: string | null) => {
    if (!roomNos.length) return;
    setAssignBusy(true);
    setError(null);
    try {
      await Promise.all(roomNos.map((roomNo) => patchHkRoomAssign(roomNo, staffName)));
      setRooms((prev) =>
        prev.map((r) => (roomNos.includes(r.roomNo) ? { ...r, assignee: staffName ?? undefined } : r)),
      );
      setBoardRows((prev) =>
        prev.map((r) =>
          roomNos.includes(r.roomNo) ? { ...r, assignedTo: staffName ?? undefined } : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Atama hatası');
    } finally {
      setAssignBusy(false);
    }
  }, []);

  const exportTitle = 'HK Atama & Rapor';

  return (
    <>
      <HkAssignProApp
        embedded
        rooms={rooms}
        setRooms={setRooms}
        loading={loading}
        error={error}
        assignBusy={assignBusy}
        totalRooms={boardRows.length}
        onRefresh={() => void loadRooms()}
        onPersistAssign={persistAssign}
        onExportCsv={() =>
          downloadHkListCsv(boardRows, `hk-atama-${new Date().toISOString().slice(0, 10)}.csv`)
        }
        onExportPdf={() => printHkListPdf(boardRows, exportTitle, 'Kat hizmetleri atama raporu')}
        onPrintStaffReport={(staffName) => {
          const staff = HK_STAFF.find((s) => s.name === staffName);
          if (staff) printStaffReportA4(staff, boardRows, guestRequests, faults);
        }}
      />
      <HkMobileNav />
    </>
  );
}
