'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  FileSpreadsheet,
  FileText,
  LayoutList,
  Layers,
  RefreshCw,
  Square,
  UserRound,
  Users,
} from 'lucide-react';
import { HkMobileFrame } from '@/components/housekeeping/HkMobileFrame';
import { HkStatusDots } from '@/components/housekeeping/HkStatusDots';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import {
  downloadHkListCsv,
  exportHkStaffReport,
  printHkListPdf,
} from '@/lib/client/hk-list-export';
import { patchHkRoom, patchHkRoomAssign } from '@/lib/client/hk-update';
import { maskGuestName } from '@/lib/kvkk';
import { HK_FLOOR_OPTIONS, HK_STAFF, staffForFloor, type HkStaffMember } from '@/lib/housekeeping/staff';
import { roomioFetch } from '@/lib/client/api';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

type ViewMode = 'floor' | 'staff' | 'all';
type StatusFilter = HousekeepingBoardRow['status'] | 'ALL' | 'WORK';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function countByStatus(rooms: HousekeepingBoardRow[]) {
  return {
    clean: rooms.filter((r) => r.status === 'CLEAN').length,
    dirty: rooms.filter((r) => r.status === 'DIRTY').length,
    inspect: rooms.filter((r) => r.status === 'INSPECT').length,
    work: rooms.filter((r) => ['DIRTY', 'INSPECT'].includes(r.status)).length,
  };
}

function needsWork(r: HousekeepingBoardRow) {
  return r.status === 'DIRTY' || r.status === 'INSPECT';
}

/** HK mobil — atama & rapor (Kat / Katçı / Tümü — klasik tasarım) */
export function HkMobileAssignReportClient() {
  const [rooms, setRooms] = useState<HousekeepingBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('floor');
  const [floorFilter, setFloorFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('WORK');
  const [staffFilter, setStaffFilter] = useState<string | 'ALL' | 'UNASSIGNED'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignStaff, setAssignStaff] = useState(HK_STAFF[0]?.name ?? '');
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

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
    if (floorFilter !== 'ALL') list = list.filter((r) => r.floor === floorFilter);
    if (staffFilter === 'UNASSIGNED') list = list.filter((r) => !r.assignedTo);
    else if (staffFilter !== 'ALL') list = list.filter((r) => r.assignedTo === staffFilter);
    if (statusFilter === 'WORK') list = list.filter(needsWork);
    else if (statusFilter !== 'ALL') list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.roomNo.includes(q) ||
          r.guestName?.toLowerCase().includes(q) ||
          r.assignedTo?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rooms, floorFilter, staffFilter, statusFilter, search]);

  const counts = useMemo(() => countByStatus(rooms), [rooms]);

  const staffStats = useMemo(() => {
    return HK_STAFF.map((s) => ({
      ...s,
      total: rooms.filter((r) => r.assignedTo === s.name).length,
      work: rooms.filter((r) => r.assignedTo === s.name && needsWork(r)).length,
    }));
  }, [rooms]);

  const groupedByFloor = useMemo(() => {
    const map = new Map<number, HousekeepingBoardRow[]>();
    for (const floor of HK_FLOOR_OPTIONS) map.set(floor, []);
    for (const r of filtered) {
      const list = map.get(r.floor) ?? [];
      list.push(r);
      map.set(r.floor, list);
    }
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [filtered]);

  const groupedByStaff = useMemo(() => {
    const groups: { key: string; label: string; rows: HousekeepingBoardRow[] }[] = HK_STAFF.map((s) => ({
      key: s.id,
      label: s.name,
      rows: filtered.filter((r) => r.assignedTo === s.name),
    }));
    const unassigned = filtered.filter((r) => !r.assignedTo);
    if (unassigned.length) {
      groups.push({ key: 'unassigned', label: 'Atanmamış', rows: unassigned });
    }
    return groups.filter((g) => g.rows.length > 0);
  }, [filtered]);

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

  async function assignRooms(roomNos: string[], staffName: string | null) {
    if (!roomNos.length) return;
    setBulkBusy(true);
    try {
      await Promise.all(roomNos.map((roomNo) => patchHkRoomAssign(roomNo, staffName)));
      setRooms((prev) =>
        prev.map((r) =>
          roomNos.includes(r.roomNo) ? { ...r, assignedTo: staffName ?? undefined } : r,
        ),
      );
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Atama hatası');
    } finally {
      setBulkBusy(false);
    }
  }

  async function autoDistributeFloors(floors: number[]) {
    const toAssign: { roomNo: string; staff: string }[] = [];
    for (const floor of floors) {
      const staff = staffForFloor(floor);
      if (!staff) continue;
      for (const r of rooms) {
        if (r.floor === floor && needsWork(r)) {
          toAssign.push({ roomNo: r.roomNo, staff: staff.name });
        }
      }
    }
    if (!toAssign.length) return;
    setBulkBusy(true);
    try {
      await Promise.all(toAssign.map(({ roomNo, staff }) => patchHkRoomAssign(roomNo, staff)));
      setRooms((prev) =>
        prev.map((r) => {
          const hit = toAssign.find((a) => a.roomNo === r.roomNo);
          return hit ? { ...r, assignedTo: hit.staff } : r;
        }),
      );
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleRoom(roomNo: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roomNo)) next.delete(roomNo);
      else next.add(roomNo);
      return next;
    });
  }

  function toggleSection(roomNos: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = roomNos.every((n) => next.has(n));
      if (allSelected) roomNos.forEach((n) => next.delete(n));
      else roomNos.forEach((n) => next.add(n));
      return next;
    });
  }

  const exportTitle =
    floorFilter !== 'ALL'
      ? `HK Rapor — Kat ${floorFilter}`
      : staffFilter !== 'ALL' && staffFilter !== 'UNASSIGNED'
        ? `HK Rapor — ${staffFilter}`
        : 'HK Atama & Rapor';

  const headerActions = (
    <div className="roomio-hk-liste__exports">
      <button
        type="button"
        className="roomio-btn roomio-btn--ghost roomio-btn--sm"
        title="Excel (CSV)"
        onClick={() => downloadHkListCsv(filtered, `hk-rapor-${new Date().toISOString().slice(0, 10)}.csv`)}
      >
        <FileSpreadsheet size={16} />
        Excel
      </button>
      <button
        type="button"
        className="roomio-btn roomio-btn--ghost roomio-btn--sm"
        title="PDF yazdır"
        onClick={() => printHkListPdf(filtered, exportTitle, 'Kat hizmetleri atama raporu')}
      >
        <FileText size={16} />
        PDF
      </button>
    </div>
  );

  return (
    <HkMobileFrame title="Atama & Rapor" actions={headerActions}>
      <div className="roomio-hk-liste roomio-hk-liste--one-screen">
        <div className="roomio-hk-liste__kpi">
          <span>
            <strong>{counts.work}</strong> iş
          </span>
          <span>
            <strong>{counts.dirty}</strong> kirli
          </span>
          <span>
            <strong>{counts.inspect}</strong> kontrol
          </span>
          <span>
            <strong>{counts.clean}</strong> temiz
          </span>
        </div>

        <div className="roomio-hk-liste__toolbar">
          <div className="roomio-hk-liste__modes" role="tablist" aria-label="Görünüm">
            {(
              [
                { id: 'floor' as const, label: 'Kat', icon: Layers },
                { id: 'staff' as const, label: 'Katçı', icon: Users },
                { id: 'all' as const, label: 'Tümü', icon: LayoutList },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                className={`roomio-hk-liste__mode${viewMode === id ? ' is-active' : ''}`}
                onClick={() => setViewMode(id)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="roomio-btn roomio-btn--ghost roomio-btn--sm"
            onClick={() => void loadRooms()}
            aria-label="Yenile"
          >
            <RefreshCw size={14} className={loading ? 'roomio-spin' : ''} />
          </button>
        </div>

        <div className="roomio-hk-liste__filters">
          <input
            type="search"
            className="roomio-input roomio-input--compact roomio-hk-liste__search"
            placeholder="Oda / misafir / katçı…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="roomio-select roomio-select--compact"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Durum filtresi"
          >
            <option value="WORK">İş bekleyen</option>
            <option value="ALL">Tüm durumlar</option>
            {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
              <option key={s} value={s}>
                {HK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {viewMode !== 'staff' ? (
          <div className="roomio-hk-liste__chips" role="group" aria-label="Kat filtresi">
            <button
              type="button"
              className={`roomio-hk-liste__chip${floorFilter === 'ALL' ? ' is-active' : ''}`}
              onClick={() => setFloorFilter('ALL')}
            >
              Tüm katlar
            </button>
            {HK_FLOOR_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                className={`roomio-hk-liste__chip${floorFilter === f ? ' is-active' : ''}`}
                onClick={() => setFloorFilter(f)}
              >
                Kat {f}
              </button>
            ))}
            <button
              type="button"
              className="roomio-hk-liste__chip roomio-hk-liste__chip--action"
              disabled={bulkBusy}
              onClick={() =>
                void autoDistributeFloors(floorFilter === 'ALL' ? HK_FLOOR_OPTIONS : [floorFilter])
              }
            >
              Katları dağıt
            </button>
          </div>
        ) : (
          <div className="roomio-hk-liste__staff-row">
            {staffStats.map((s) => (
              <StaffCard
                key={s.id}
                staff={s}
                active={staffFilter === s.name}
                onSelect={() => setStaffFilter(staffFilter === s.name ? 'ALL' : s.name)}
                onExportCsv={() => exportHkStaffReport(rooms, s.name, 'csv')}
                onExportPdf={() => exportHkStaffReport(rooms, s.name, 'pdf')}
              />
            ))}
            <button
              type="button"
              className={`roomio-hk-liste__chip${staffFilter === 'UNASSIGNED' ? ' is-active' : ''}`}
              onClick={() => setStaffFilter(staffFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
            >
              Atanmamış
            </button>
          </div>
        )}

        {error ? <p className="roomio-hk-liste__error">{error}</p> : null}

        <div className="roomio-hk-liste__body">
          {loading ? (
            <p className="roomio-hk-liste__empty">Yükleniyor…</p>
          ) : filtered.length === 0 ? (
            <p className="roomio-hk-liste__empty">Filtreye uygun oda yok.</p>
          ) : viewMode === 'floor' ? (
            groupedByFloor.map(([floor, rows]) => (
              <RoomSection
                key={floor}
                title={`Kat ${floor}`}
                subtitle={`${rows.length} oda · ${staffForFloor(floor)?.name ?? '—'}`}
                rows={rows}
                selected={selected}
                savingRoom={savingRoom}
                onToggleRoom={toggleRoom}
                onToggleSection={() => toggleSection(rows.map((r) => r.roomNo))}
                onStatusChange={updateStatus}
              />
            ))
          ) : viewMode === 'staff' ? (
            groupedByStaff.map((g) => (
              <RoomSection
                key={g.key}
                title={g.label}
                subtitle={`${g.rows.length} oda`}
                rows={g.rows}
                selected={selected}
                savingRoom={savingRoom}
                onToggleRoom={toggleRoom}
                onToggleSection={() => toggleSection(g.rows.map((r) => r.roomNo))}
                onStatusChange={updateStatus}
                staffName={g.key !== 'unassigned' ? g.label : undefined}
                onStaffExportCsv={
                  g.key !== 'unassigned' ? () => exportHkStaffReport(rooms, g.label, 'csv') : undefined
                }
                onStaffExportPdf={
                  g.key !== 'unassigned' ? () => exportHkStaffReport(rooms, g.label, 'pdf') : undefined
                }
              />
            ))
          ) : (
            <RoomSection
              title="Tüm odalar"
              subtitle={`${filtered.length} oda`}
              rows={filtered}
              selected={selected}
              savingRoom={savingRoom}
              onToggleRoom={toggleRoom}
              onToggleSection={() => toggleSection(filtered.map((r) => r.roomNo))}
              onStatusChange={updateStatus}
              flat
            />
          )}
        </div>

        {selected.size > 0 ? (
          <div className="roomio-hk-liste__assign-bar">
            <span>{selected.size} oda seçili</span>
            <select
              className="roomio-select roomio-select--compact"
              value={assignStaff}
              onChange={(e) => setAssignStaff(e.target.value)}
              aria-label="Katçı seç"
            >
              {HK_STAFF.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="roomio-btn roomio-btn--primary roomio-btn--sm"
              disabled={bulkBusy}
              onClick={() => void assignRooms([...selected], assignStaff)}
            >
              Ata
            </button>
            <button
              type="button"
              className="roomio-btn roomio-btn--ghost roomio-btn--sm"
              disabled={bulkBusy}
              onClick={() => void assignRooms([...selected], null)}
            >
              Temizle
            </button>
            <button
              type="button"
              className="roomio-btn roomio-btn--ghost roomio-btn--sm"
              onClick={() => setSelected(new Set())}
            >
              İptal
            </button>
          </div>
        ) : null}
      </div>
    </HkMobileFrame>
  );
}

function StaffCard({
  staff,
  active,
  onSelect,
  onExportCsv,
  onExportPdf,
}: {
  staff: HkStaffMember & { total: number; work: number };
  active: boolean;
  onSelect: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  return (
    <div className={`roomio-hk-liste__staff-card${active ? ' is-active' : ''}`}>
      <button type="button" className="roomio-hk-liste__staff-main" onClick={onSelect}>
        <UserRound size={16} />
        <span className="roomio-hk-liste__staff-name">{staff.name}</span>
        <small>Kat {staff.floors.join(', ')}</small>
        <span className="roomio-hk-liste__staff-count">
          {staff.work} iş / {staff.total} oda
        </span>
      </button>
      <div className="roomio-hk-liste__staff-export">
        <button type="button" title="Excel" onClick={onExportCsv} aria-label={`${staff.name} Excel`}>
          <FileSpreadsheet size={13} />
        </button>
        <button type="button" title="PDF" onClick={onExportPdf} aria-label={`${staff.name} PDF`}>
          <FileText size={13} />
        </button>
      </div>
    </div>
  );
}

function RoomSection({
  title,
  subtitle,
  rows,
  selected,
  savingRoom,
  onToggleRoom,
  onToggleSection,
  onStatusChange,
  flat,
  staffName,
  onStaffExportCsv,
  onStaffExportPdf,
}: {
  title: string;
  subtitle: string;
  rows: HousekeepingBoardRow[];
  selected: Set<string>;
  savingRoom: string | null;
  onToggleRoom: (roomNo: string) => void;
  onToggleSection: () => void;
  onStatusChange: (roomNo: string, status: HousekeepingBoardRow['status']) => void;
  flat?: boolean;
  staffName?: string;
  onStaffExportCsv?: () => void;
  onStaffExportPdf?: () => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.roomNo));

  return (
    <section className={`roomio-hk-liste__section${flat ? ' roomio-hk-liste__section--flat' : ''}`}>
      <header className="roomio-hk-liste__section-head">
        <button type="button" className="roomio-hk-liste__section-check" onClick={onToggleSection}>
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        {staffName && onStaffExportCsv && onStaffExportPdf ? (
          <div className="roomio-hk-liste__section-export">
            <button type="button" onClick={onStaffExportCsv} title="Katçı Excel">
              <FileSpreadsheet size={14} />
            </button>
            <button type="button" onClick={onStaffExportPdf} title="Katçı PDF">
              <FileText size={14} />
            </button>
          </div>
        ) : null}
      </header>
      <ul className="roomio-hk-liste__rows">
        {rows.map((r) => (
          <li key={r.roomNo} className={selected.has(r.roomNo) ? 'is-selected' : ''}>
            <button
              type="button"
              className="roomio-hk-liste__row-check"
              onClick={() => onToggleRoom(r.roomNo)}
              aria-label={`Oda ${r.roomNo} seç`}
            >
              {selected.has(r.roomNo) ? <CheckSquare size={15} /> : <Square size={15} />}
            </button>
            <div className="roomio-hk-liste__row-main">
              <strong>{r.roomNo}</strong>
              <span>
                {r.floor}. kat · {r.type}
              </span>
              <span className="roomio-hk-liste__row-guest">
                {r.guestName ? maskGuestName(r.guestName) : 'Boş'}
                {r.checkOut ? ` · çıkış ${formatDate(r.checkOut)}` : ''}
              </span>
            </div>
            <HkStatusDots status={r.status} />
            <span className="roomio-hk-liste__row-staff">{r.assignedTo ?? '—'}</span>
            <select
              className="roomio-select roomio-select--compact"
              value={r.status}
              disabled={savingRoom === r.roomNo}
              onChange={(e) =>
                void onStatusChange(r.roomNo, e.target.value as HousekeepingBoardRow['status'])
              }
              aria-label={`Oda ${r.roomNo} durumu`}
            >
              {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
                <option key={s} value={s}>
                  {HK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
