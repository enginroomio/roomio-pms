'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
} from 'lucide-react';
import { HkStaffReportSheet } from '@/components/housekeeping/HkStaffReportSheet';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { roomioFetch } from '@/lib/client/api';
import { downloadHkListCsv, printHkListPdf } from '@/lib/client/hk-list-export';
import { patchHkRoomAssign } from '@/lib/client/hk-update';
import {
  buildStaffReportRows,
  faultsForStaff,
  printStaffReportA4,
  staffPendingRequests,
} from '@/lib/client/hk-staff-report';
import { HK_STAFF, type HkStaffMember } from '@/lib/housekeeping/staff';
import { FLOORS } from '@/lib/rooms/room-config';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import { HkRoutingPanel } from '@/components/housekeeping/HkRoutingPanel';
import type { RoomFault } from '@/lib/server/fault-service';

const STAFF_CAPACITY = 15;

function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function statusDot(status: HousekeepingBoardRow['status']) {
  if (status === 'CLEAN') return 'clean';
  if (status === 'DIRTY' || status === 'OOO' || status === 'DND') return 'dirty';
  return 'inspect';
}

function taskCode(task: string) {
  if (task === 'Çıkış') return 'O/D';
  if (task === 'Giriş haz.') return 'V/D';
  if (task === 'Kontrol') return 'O/C';
  if (task === 'Arıza') return 'OOO';
  return 'K/O';
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'green' | 'red' | 'orange' | 'blue' | 'teal';
}) {
  return (
    <div className="roomio-hk-hub-mock__kpi-card">
      <span className={`roomio-hk-hub-mock__kpi-icon roomio-hk-hub-mock__kpi-icon--${tone}`}>
        {value.slice(0, 2)}
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Mockup: Housekeeping & Operations Hub — canlı veri */
export function HkOperationsHubClient() {
  const [boardRows, setBoardRows] = useState<HousekeepingBoardRow[]>([]);
  const [requests, setRequests] = useState<HkGuestRequestRecord[]>([]);
  const [faults, setFaults] = useState<RoomFault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'floors' | 'rooms'>('floors');
  const [floor, setFloor] = useState(1);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [assignStaff, setAssignStaff] = useState(HK_STAFF[0]?.name ?? '');
  const [activeStaff, setActiveStaff] = useState<HkStaffMember>(HK_STAFF[0]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [assignBusy, setAssignBusy] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsRes, reqRes, faultRes] = await Promise.all([
        roomioFetch('/api/housekeeping/rooms'),
        roomioFetch('/api/housekeeping/requests?status=active'),
        roomioFetch('/api/housekeeping/faults?status=active'),
      ]);
      if (!roomsRes.ok) throw new Error('Oda verileri yüklenemedi');
      const roomsData = (await roomsRes.json()) as { rooms: HousekeepingBoardRow[] };
      setBoardRows(roomsData.rooms);
      if (reqRes.ok) {
        const reqData = (await reqRes.json()) as { requests: HkGuestRequestRecord[] };
        setRequests(reqData.requests);
      }
      if (faultRes.ok) {
        const faultData = (await faultRes.json()) as { faults: RoomFault[] };
        setFaults(faultData.faults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const floorRooms = useMemo(() => {
    let list = boardRows.filter((r) => r.floor === floor);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.roomNo.includes(q) ||
          r.guestName?.toLowerCase().includes(q) ||
          r.assignedTo?.toLowerCase().includes(q),
      );
    }
    if (filter === 'dirty') list = list.filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT');
    if (filter === 'clean') list = list.filter((r) => r.status === 'CLEAN');
    return list;
  }, [boardRows, floor, search, filter]);

  const kpis = useMemo(() => {
    const total = boardRows.length;
    const dirty = boardRows.filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT').length;
    const clean = boardRows.filter((r) => r.status === 'CLEAN').length;
    const occupied = boardRows.filter((r) => r.guestName).length;
    const vacant = total - occupied;
    const staffActive = HK_STAFF.filter((s) => boardRows.some((r) => r.assignedTo === s.name)).length;
    return { total, clean, dirty, vacant, occupied, staffActive };
  }, [boardRows]);

  const staffStats = useMemo(() => {
    return HK_STAFF.map((s) => {
      const assigned = boardRows.filter((r) => r.assignedTo === s.name);
      const done = assigned.filter((r) => r.status === 'CLEAN').length;
      const donePct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;
      const reqCount = staffPendingRequests(s, boardRows, requests).length;
      const faultCount = faultsForStaff(s, boardRows, faults).length;
      return { ...s, assigned: assigned.length, donePct, reqCount, faultCount };
    });
  }, [boardRows, requests, faults]);

  const reportRows = useMemo(
    () => buildStaffReportRows(activeStaff.name, boardRows, requests, faults),
    [activeStaff.name, boardRows, requests, faults],
  );

  function toggleRoom(roomNo: string) {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomNo)) next.delete(roomNo);
      else next.add(roomNo);
      return next;
    });
  }

  function assignFloorToStaff(floorNo: number) {
    const roomsOnFloor = boardRows.filter((r) => r.floor === floorNo).map((r) => r.roomNo);
    setSelectedRooms(new Set(roomsOnFloor));
    setFloor(floorNo);
  }

  async function persistAssign(roomNos: string[], staffName: string | null) {
    if (!roomNos.length) return;
    setAssignBusy(true);
    setError(null);
    try {
      await Promise.all(roomNos.map((roomNo) => patchHkRoomAssign(roomNo, staffName)));
      setBoardRows((prev) =>
        prev.map((r) => (roomNos.includes(r.roomNo) ? { ...r, assignedTo: staffName ?? undefined } : r)),
      );
      setSelectedRooms(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Atama hatası');
    } finally {
      setAssignBusy(false);
    }
  }

  function exportAll(format: 'csv' | 'pdf') {
    if (format === 'csv') downloadHkListCsv(boardRows, `hk-operations-${new Date().toISOString().slice(0, 10)}.csv`);
    else printHkListPdf(boardRows, 'Housekeeping Operations Hub', 'Tüm odalar');
  }

  return (
    <>
      <HkRoutingPanel />
      <div className="roomio-hk-hub-mock roomio-hk-hub-mock--live" style={{ marginTop: 16 }}>
      {error ? <p className="roomio-hk-hub-mock__error">{error}</p> : null}

      <div className="roomio-hk-hub-mock__toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre">
          <option value="all">Filtre: Tümü</option>
          <option value="dirty">Kirli / İş</option>
          <option value="clean">Temiz</option>
        </select>
        <label className="roomio-hk-hub-mock__search-wrap">
          <Search size={14} />
          <input
            type="search"
            placeholder="Oda / misafir / katçı ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button type="button" className="roomio-hk-hub-mock__refresh" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'roomio-spin' : undefined} />
          Yenile
        </button>
      </div>

      <div className="roomio-hk-hub-mock__kpi">
        <KpiCard label="Odalar" value={`${kpis.total}`} tone="teal" />
        <KpiCard label="Temiz" value={String(kpis.clean)} tone="green" />
        <KpiCard label="Kirli" value={String(kpis.dirty)} tone="red" />
        <KpiCard label="Boş" value={String(kpis.vacant)} tone="orange" />
        <KpiCard label="Dolu" value={String(kpis.occupied)} tone="blue" />
        <KpiCard label="Aktif katçı" value={String(kpis.staffActive)} tone="teal" />
      </div>

      <div className="roomio-hk-hub-mock__main">
        <section className="roomio-hk-hub-mock__panel">
          <div className="roomio-hk-hub-mock__panel-head">
            <h2>Oda Atama</h2>
            <div className="roomio-hk-hub-mock__subtabs">
              <button type="button" className={subTab === 'floors' ? 'is-active' : ''} onClick={() => setSubTab('floors')}>
                KATLAR
              </button>
              <button type="button" className={subTab === 'rooms' ? 'is-active' : ''} onClick={() => setSubTab('rooms')}>
                ODALAR
              </button>
            </div>
          </div>

          <div className="roomio-hk-hub-mock__assign-body">
            <div className="roomio-hk-hub-mock__floors">
              {FLOORS.map((f) => (
                <button
                  key={f.floor}
                  type="button"
                  className={floor === f.floor ? 'is-active' : ''}
                  onClick={() => setFloor(f.floor)}
                >
                  Kat {f.floor}
                </button>
              ))}
            </div>
            <div className="roomio-hk-hub-mock__rooms">
              {floorRooms.map((r) => (
                <button
                  key={r.roomNo}
                  type="button"
                  className={`roomio-hk-hub-mock__room${selectedRooms.has(r.roomNo) ? ' is-selected' : ''}`}
                  onClick={() => toggleRoom(r.roomNo)}
                  title={`${r.roomNo} · ${HK_STATUS_LABELS[r.status]}${r.assignedTo ? ` · ${r.assignedTo}` : ''}`}
                >
                  <span className={`roomio-hk-hub-mock__room-dot roomio-hk-hub-mock__room-dot--${statusDot(r.status)}`} />
                  {r.roomNo}
                </button>
              ))}
            </div>
          </div>

          <div className="roomio-hk-hub-mock__assign-to">
            <h3>Ata · {selectedRooms.size} oda seçili</h3>
            <div className="roomio-hk-hub-mock__staff-pick">
              {staffStats.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={assignStaff === s.name ? 'is-active' : ''}
                  onClick={() => setAssignStaff(s.name)}
                >
                  <span className="roomio-hk-hub-mock__avatar">{initials(s.name)}</span>
                  <span className="roomio-hk-hub-mock__staff-meta">
                    <strong>{s.name}</strong>
                    <small>Kat {s.floors.join(', ')}</small>
                  </span>
                  <span>
                    {s.assigned}/{STAFF_CAPACITY}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="roomio-hk-hub-mock__assign-btn"
              disabled={!selectedRooms.size || assignBusy}
              onClick={() => void persistAssign([...selectedRooms], assignStaff)}
            >
              {assignBusy ? 'Atanıyor…' : `Seçili odaları ata (${selectedRooms.size})`}
            </button>
          </div>

          <div className="roomio-hk-hub-mock__floor-cards" aria-label="Kat kartları">
            {FLOORS.map((f) => (
              <button
                key={f.floor}
                type="button"
                className="roomio-hk-hub-mock__floor-card"
                onClick={() => assignFloorToStaff(f.floor)}
              >
                KAT {f.floor}
                <br />
                <small>{boardRows.filter((r) => r.floor === f.floor).length} oda</small>
              </button>
            ))}
          </div>
        </section>

        <section className="roomio-hk-hub-mock__panel">
          <div className="roomio-hk-hub-mock__panel-head">
            <h2>Katçı &amp; Rapor</h2>
            <div className="roomio-hk-hub-mock__exports">
              <button type="button" onClick={() => printStaffReportA4(activeStaff, boardRows, requests, faults)}>
                <Printer size={14} /> Yazdır
              </button>
              <button type="button" onClick={() => exportAll('pdf')}>
                <FileText size={14} /> PDF
              </button>
              <button type="button" onClick={() => exportAll('csv')}>
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          </div>

          <table className="roomio-hk-hub-mock__staff-table">
            <thead>
              <tr>
                <th>Katçı</th>
                <th>Durum</th>
                <th>Atanan</th>
                <th>Tamam</th>
                <th>Talep</th>
                <th>Arıza</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((s) => (
                <tr
                  key={s.id}
                  className={`roomio-hk-hub-mock__staff-row${activeStaff.id === s.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveStaff(s);
                    setShowFullReport(false);
                  }}
                >
                  <td><strong>{s.name}</strong></td>
                  <td><span className="roomio-hk-hub-mock__pill">Aktif</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{s.assigned}/{STAFF_CAPACITY}</span>
                      <div className="roomio-hk-hub-mock__progress" aria-hidden>
                        <span style={{ width: `${Math.min(100, (s.assigned / STAFF_CAPACITY) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{s.donePct}%</td>
                  <td>{s.reqCount || '—'}</td>
                  <td>{s.faultCount || '—'}</td>
                  <td>
                    <div className="roomio-hk-hub-mock__actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printStaffReportA4(s, boardRows, requests, faults);
                        }}
                      >
                        RAPOR
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStaff(s);
                          setShowFullReport(true);
                        }}
                      >
                        GÖR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="roomio-hk-hub-mock__report">
            <div className="roomio-hk-hub-mock__report-head">
              <strong>{activeStaff.name.toUpperCase()} — günlük görev</strong>
              <button
                type="button"
                className="roomio-hk-hub-mock__exports"
                onClick={() => printStaffReportA4(activeStaff, boardRows, requests, faults)}
              >
                <Printer size={14} /> YAZDIR
              </button>
            </div>

            {showFullReport ? (
              <div className="roomio-hk-hub-mock__report-sheet">
                <HkStaffReportSheet
                  staff={activeStaff}
                  boardRows={boardRows}
                  guestRequests={requests}
                  faults={faults}
                />
              </div>
            ) : (
              <ul className="roomio-hk-hub-mock__report-list">
                {reportRows.length ? (
                  reportRows.map((row) => (
                    <li key={row.roomNo}>
                      <strong>Oda {row.roomNo}</strong>
                      <span>
                        {row.task}
                        {row.requests !== '—' ? ` · ${row.requests}` : ''}
                        {row.faults !== '—' ? ` · ${row.faults}` : ''}
                      </span>
                      <span className={`roomio-hk-hub-mock__tag${row.task === 'Kontrol' ? ' roomio-hk-hub-mock__tag--clean' : ''}`}>
                        {taskCode(row.task)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="roomio-hk-hub-mock__report-empty">Bu katçıya atanmış oda yok.</li>
                )}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
