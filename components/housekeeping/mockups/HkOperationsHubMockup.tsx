'use client';

import { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from 'lucide-react';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { HK_STAFF } from '@/lib/housekeeping/staff';
import { FLOORS } from '@/lib/rooms/room-config';
import { downloadHkListCsv, printHkListPdf } from '@/lib/client/hk-list-export';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

type RoomCell = {
  roomNo: string;
  floor: number;
  status: HousekeepingBoardRow['status'];
  guest?: string;
  note?: string;
};

const STAFF_MOCK = [
  { id: 'fatma', name: 'Fatma Y.', initials: 'FY', assigned: 14, capacity: 15, donePct: 72 },
  { id: 'mehmet', name: 'Mehmet A.', initials: 'MA', assigned: 12, capacity: 14, donePct: 60 },
  { id: 'ayse', name: 'Ayşe D.', initials: 'AD', assigned: 11, capacity: 12, donePct: 55 },
  { id: 'mustafa', name: 'Mustafa K.', initials: 'MK', assigned: 9, capacity: 12, donePct: 48 },
  { id: 'elif', name: 'Elif K.', initials: 'EK', assigned: 8, capacity: 10, donePct: 65 },
];

const DEMO_ROOMS: RoomCell[] = [
  { roomNo: '101', floor: 1, status: 'CLEAN' },
  { roomNo: '102', floor: 1, status: 'CLEAN' },
  { roomNo: '104', floor: 1, status: 'DIRTY', guest: 'C. Arslan', note: 'Çıkış 11:00' },
  { roomNo: '108', floor: 1, status: 'DIRTY', guest: '—', note: 'Konaklama' },
  { roomNo: '110', floor: 1, status: 'INSPECT' },
  { roomNo: '115', floor: 1, status: 'CLEAN' },
  { roomNo: '116', floor: 1, status: 'DIRTY', guest: 'M. Rossi', note: 'Giriş 14:00' },
  { roomNo: '201', floor: 2, status: 'CLEAN' },
  { roomNo: '204', floor: 2, status: 'INSPECT', guest: 'T. Klein' },
  { roomNo: '205', floor: 2, status: 'DIRTY', guest: 'J. Miller', note: 'Çıkış 11:00' },
  { roomNo: '210', floor: 2, status: 'CLEAN' },
  { roomNo: '215', floor: 2, status: 'DIRTY', guest: 'Z. Ak', note: 'Giriş 14:00' },
  { roomNo: '301', floor: 3, status: 'CLEAN' },
  { roomNo: '305', floor: 3, status: 'DIRTY' },
  { roomNo: '312', floor: 3, status: 'DND', guest: 'Misafir', note: 'Rahatsız etmeyin' },
  { roomNo: '318', floor: 3, status: 'CLEAN' },
  { roomNo: '401', floor: 4, status: 'CLEAN' },
  { roomNo: '410', floor: 4, status: 'OOO', note: 'Bakımda' },
  { roomNo: '415', floor: 4, status: 'OOO', note: 'Jakuzi arızası' },
  { roomNo: '501', floor: 5, status: 'CLEAN' },
  { roomNo: '505', floor: 5, status: 'DIRTY' },
  { roomNo: '510', floor: 5, status: 'INSPECT' },
];

const REPORT_TASKS: Record<string, { roomNo: string; code: string; note: string }[]> = {
  ayse: [
    { roomNo: '301', code: 'V/D', note: 'Check-in 14:00' },
    { roomNo: '304', code: 'O/C', note: 'Light clean' },
    { roomNo: '312', code: 'DND', note: 'Rahatsız etmeyin' },
  ],
  elif: [
    { roomNo: '108', code: 'V/D', note: 'Çıkış temizliği' },
    { roomNo: '204', code: 'O/C', note: 'Kontrol bekliyor' },
  ],
  fatma: [
    { roomNo: '104', code: 'O/D', note: 'Erken çıkış' },
    { roomNo: '116', code: 'V/D', note: 'Giriş hazırlığı' },
  ],
};

function statusDot(status: RoomCell['status']) {
  if (status === 'CLEAN') return 'clean';
  if (status === 'DIRTY' || status === 'OOO' || status === 'DND') return 'dirty';
  return 'inspect';
}

function toExportRows(rooms: RoomCell[], assignee: string): HousekeepingBoardRow[] {
  return rooms.map((r) => ({
    id: r.roomNo,
    roomNo: r.roomNo,
    floor: r.floor,
    type: 'DBL',
    status: r.status === 'OOO' || r.status === 'DND' ? r.status : r.status,
    assignedTo: assignee,
    lastUpdated: new Date().toISOString().slice(0, 10),
    guestName: r.guest,
    notes: r.note,
  }));
}

/** Referans görsel: Housekeeping & Operations Hub mockup */
export function HkOperationsHubMockup() {
  const [nav, setNav] = useState('Dashboard');
  const [subTab, setSubTab] = useState<'floors' | 'rooms'>('floors');
  const [floor, setFloor] = useState(1);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set(['104', '108']));
  const [assignStaff, setAssignStaff] = useState('ayse');
  const [activeStaff, setActiveStaff] = useState('ayse');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const floorRooms = useMemo(() => {
    let list = DEMO_ROOMS.filter((r) => r.floor === floor);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.roomNo.includes(q) || r.guest?.toLowerCase().includes(q));
    }
    if (filter === 'dirty') list = list.filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT');
    if (filter === 'clean') list = list.filter((r) => r.status === 'CLEAN');
    return list;
  }, [floor, search, filter]);

  const kpis = useMemo(() => {
    const total = 77;
    const dirty = DEMO_ROOMS.filter((r) => r.status === 'DIRTY').length + 28;
    const clean = total - dirty - 5;
    return {
      rooms: `${total}/${total}`,
      clean,
      dirty,
      vacant: 42,
      occupied: 35,
      staff: STAFF_MOCK.filter((s) => s.donePct > 0).length,
    };
  }, []);

  const activeReport = REPORT_TASKS[activeStaff] ?? REPORT_TASKS.ayse;
  const activeStaffName = STAFF_MOCK.find((s) => s.id === activeStaff)?.name ?? 'Ayşe D.';

  function toggleRoom(roomNo: string) {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomNo)) next.delete(roomNo);
      else next.add(roomNo);
      return next;
    });
  }

  function assignFloorToStaff(floorNo: number) {
    const roomsOnFloor = DEMO_ROOMS.filter((r) => r.floor === floorNo).map((r) => r.roomNo);
    setSelectedRooms(new Set(roomsOnFloor));
    setFloor(floorNo);
  }

  function exportAll(format: 'csv' | 'pdf') {
    const rows = toExportRows(DEMO_ROOMS, 'Tüm liste');
    if (format === 'csv') downloadHkListCsv(rows, 'hk-operations-hub.csv');
    else printHkListPdf(rows, 'Housekeeping Operations Hub', 'Tüm odalar');
  }

  function exportStaff(staffId: string, format: 'csv' | 'pdf') {
    const staff = STAFF_MOCK.find((s) => s.id === staffId);
    const rooms = DEMO_ROOMS.filter((_, i) => i % STAFF_MOCK.length === STAFF_MOCK.findIndex((x) => x.id === staffId));
    const rows = toExportRows(rooms, staff?.name ?? staffId);
    if (format === 'csv') downloadHkListCsv(rows, `hk-${staffId}.csv`);
    else printHkListPdf(rows, `Katçı Raporu — ${staff?.name}`, 'Günlük görev listesi');
  }

  return (
    <div className="roomio-hk-hub-mock">
      <div className="roomio-hk-hub-mock__badge">
        MOCKUP · Referans: Housekeeping &amp; Operations Hub — Roomio HK Liste v2 tasarımı
      </div>

      <header className="roomio-hk-hub-mock__top">
        <div className="roomio-hk-hub-mock__brand">
          <h1>Hotel Management — Housekeeping &amp; Operations Hub</h1>
          <nav className="roomio-hk-hub-mock__nav" aria-label="Üst menü">
            {['Dashboard', 'Schedule', 'Reports', 'Staff', 'Settings', 'Login', 'Help'].map((item) => (
              <button
                key={item}
                type="button"
                className={nav === item ? 'is-active' : ''}
                onClick={() => setNav(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="roomio-hk-hub-mock__toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtre">
          <option value="all">Filter: Tümü</option>
          <option value="dirty">Kirli / İş</option>
          <option value="clean">Temiz</option>
        </select>
        <label className="roomio-hk-hub-mock__search-wrap" style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 6 }}>
          <Search size={14} />
          <input
            type="search"
            placeholder="Search room / guest / staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className="roomio-hk-hub-mock__kpi">
        <KpiCard label="Rooms" value={kpis.rooms} tone="teal" />
        <KpiCard label="Clean" value={String(kpis.clean)} tone="green" />
        <KpiCard label="Dirty" value={String(kpis.dirty)} tone="red" />
        <KpiCard label="Vacant" value={String(kpis.vacant)} tone="orange" />
        <KpiCard label="Occupied" value={String(kpis.occupied)} tone="blue" />
        <KpiCard label="Staff Active" value={String(kpis.staff)} tone="teal" />
      </div>

      <div className="roomio-hk-hub-mock__main">
        <section className="roomio-hk-hub-mock__panel">
          <div className="roomio-hk-hub-mock__panel-head">
            <h2>Room Assignment</h2>
            <div className="roomio-hk-hub-mock__subtabs">
              <button
                type="button"
                className={subTab === 'floors' ? 'is-active' : ''}
                onClick={() => setSubTab('floors')}
              >
                FLOORS
              </button>
              <button
                type="button"
                className={subTab === 'rooms' ? 'is-active' : ''}
                onClick={() => setSubTab('rooms')}
              >
                ROOMS
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
                  Floor {f.floor}
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
                  title={`${r.roomNo} · ${HK_STATUS_LABELS[r.status]}`}
                >
                  <span className={`roomio-hk-hub-mock__room-dot roomio-hk-hub-mock__room-dot--${statusDot(r.status)}`} />
                  {r.roomNo}
                </button>
              ))}
            </div>
          </div>

          <div className="roomio-hk-hub-mock__assign-to">
            <h3>Assign To · {selectedRooms.size} oda seçili</h3>
            <div className="roomio-hk-hub-mock__staff-pick">
              {STAFF_MOCK.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={assignStaff === s.id ? 'is-active' : ''}
                  onClick={() => setAssignStaff(s.id)}
                >
                  <span className="roomio-hk-hub-mock__avatar">{s.initials}</span>
                  <span className="roomio-hk-hub-mock__staff-meta">
                    <strong>{s.name}</strong>
                    <small>Kat {HK_STAFF.find((h) => h.name.startsWith(s.name.split(' ')[0]))?.floors.join(', ') ?? '—'}</small>
                  </span>
                  <span>
                    {s.assigned}/{s.capacity}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="roomio-hk-hub-mock__floor-cards" aria-label="Kat kartları — sürükle bırak">
            {FLOORS.map((f) => (
              <button
                key={f.floor}
                type="button"
                className="roomio-hk-hub-mock__floor-card"
                onClick={() => assignFloorToStaff(f.floor)}
              >
                FLOOR {f.floor}
                <br />
                <small>{DEMO_ROOMS.filter((r) => r.floor === f.floor).length} oda</small>
              </button>
            ))}
          </div>
        </section>

        <section className="roomio-hk-hub-mock__panel">
          <div className="roomio-hk-hub-mock__panel-head">
            <h2>HK Staff &amp; Reporting</h2>
            <div className="roomio-hk-hub-mock__exports">
              <button type="button" onClick={() => window.print()}>
                <Printer size={14} /> Print
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
                <th>Staff</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Done</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_MOCK.map((s) => (
                <tr
                  key={s.id}
                  className={`roomio-hk-hub-mock__staff-row${activeStaff === s.id ? ' is-active' : ''}`}
                  onClick={() => setActiveStaff(s.id)}
                >
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    <span className="roomio-hk-hub-mock__pill">Active</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>
                        {s.assigned}/{s.capacity}
                      </span>
                      <div className="roomio-hk-hub-mock__progress" aria-hidden>
                        <span style={{ width: `${(s.assigned / s.capacity) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{s.donePct}%</td>
                  <td>
                    <div className="roomio-hk-hub-mock__actions">
                      <button type="button" onClick={() => exportStaff(s.id, 'pdf')}>
                        GENERATE REPORT
                      </button>
                      <button type="button" onClick={() => setActiveStaff(s.id)}>
                        VIEW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="roomio-hk-hub-mock__report">
            <div className="roomio-hk-hub-mock__report-head">
              <strong>For {activeStaffName.toUpperCase()}</strong>
              <button type="button" className="roomio-hk-hub-mock__exports" onClick={() => exportStaff(activeStaff, 'pdf')}>
                <Printer size={14} /> PRINT
              </button>
            </div>
            <ul className="roomio-hk-hub-mock__report-list">
              {activeReport.map((t) => (
                <li key={t.roomNo}>
                  <strong>Room {t.roomNo}</strong>
                  <span>{t.note}</span>
                  <span className={`roomio-hk-hub-mock__tag${t.code.includes('C') ? ' roomio-hk-hub-mock__tag--clean' : ''}`}>
                    {t.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
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
