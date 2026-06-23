'use client';

import { useMemo, useState } from 'react';
import {
  BedDouble,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { HK_STAFF } from '@/lib/housekeeping/staff';

type ViewMode = 'operations' | 'kanban' | 'queue';

export type AssignRoom = {
  roomNo: string;
  floor: number;
  status: 'CLEAN' | 'DIRTY' | 'INSPECT' | 'OOO' | 'DND';
  guest?: string;
  note?: string;
  assignee?: string;
  priority: 'high' | 'med' | 'low';
};

const DEMO_ROOMS: AssignRoom[] = [
  { roomNo: '104', floor: 1, status: 'DIRTY', guest: 'C. Arslan', note: 'Çıkış 11:00', priority: 'high' },
  { roomNo: '116', floor: 1, status: 'DIRTY', guest: 'M. Rossi', note: 'Giriş 14:00', assignee: 'Elif K.', priority: 'high' },
  { roomNo: '108', floor: 1, status: 'DIRTY', note: 'Konaklama', priority: 'med' },
  { roomNo: '110', floor: 1, status: 'INSPECT', priority: 'med' },
  { roomNo: '107', floor: 1, status: 'DIRTY', priority: 'low' },
  { roomNo: '205', floor: 2, status: 'DIRTY', guest: 'J. Miller', note: 'Çıkış 11:00', priority: 'high' },
  { roomNo: '215', floor: 2, status: 'DIRTY', guest: 'Z. Ak', note: 'Giriş 14:00', assignee: 'Elif K.', priority: 'high' },
  { roomNo: '204', floor: 2, status: 'INSPECT', guest: 'T. Klein', priority: 'med' },
  { roomNo: '305', floor: 3, status: 'DIRTY', priority: 'med', assignee: 'Murat S.' },
  { roomNo: '312', floor: 3, status: 'DND', guest: 'Misafir', note: 'Rahatsız etmeyin', priority: 'low' },
  { roomNo: '410', floor: 4, status: 'OOO', note: 'Bakımda', priority: 'low', assignee: 'Murat S.' },
  { roomNo: '505', floor: 5, status: 'DIRTY', priority: 'med', assignee: 'Zeynep A.' },
];

const MODES: { id: ViewMode; title: string; blurb: string }[] = [
  {
    id: 'operations',
    title: 'Operasyon paneli',
    blurb: 'Kat seçimi, oda ızgarası ve katçı paneli — günlük dağıtım için',
  },
  {
    id: 'kanban',
    title: 'Katçı kanban',
    blurb: 'İş yükü dengesi ve görsel atama — sabah toplantısı için',
  },
  {
    id: 'queue',
    title: 'Öncelik kuyruğu',
    blurb: 'Çıkış / giriş sırası — rush saatlerinde hızlı karar',
  },
];

const PRIORITY_LABELS = { high: 'Çıkış', med: 'Giriş', low: 'Konak.' } as const;

function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function statusSlug(status: AssignRoom['status']) {
  return status.toLowerCase();
}

function useKpis(rooms: AssignRoom[], totalRooms = 77) {
  return useMemo(() => {
    const work = rooms.filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT').length;
    const unassigned = rooms.filter(
      (r) => !r.assignee && (r.status === 'DIRTY' || r.status === 'INSPECT'),
    ).length;
    const clean = rooms.filter((r) => r.status === 'CLEAN').length;
    return { work, unassigned, staff: HK_STAFF.length, clean, total: totalRooms };
  }, [rooms, totalRooms]);
}

function StaffSidebar({
  activeStaff,
  onSelect,
  rooms,
}: {
  activeStaff: string;
  onSelect: (name: string) => void;
  rooms: AssignRoom[];
}) {
  return (
    <aside className="roomio-hk-assign-pro__aside">
      <h3>Katçılar</h3>
      <div className="roomio-hk-assign-pro__staff-list">
        {HK_STAFF.map((s) => {
          const load = rooms.filter((r) => r.assignee === s.name).length;
          const pct = Math.min(100, Math.round((load / 14) * 100));
          return (
            <button
              key={s.id}
              type="button"
              className={`roomio-hk-assign-pro__staff${activeStaff === s.name ? ' is-active' : ''}`}
              onClick={() => onSelect(s.name)}
            >
              <span className="roomio-hk-assign-pro__avatar">{initials(s.name)}</span>
              <span className="roomio-hk-assign-pro__staff-info">
                <strong>{s.name}</strong>
                <small>
                  Kat {s.floors.join(', ')} · {load} oda
                </small>
                <div className="roomio-hk-assign-pro__meter">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function DetailPanel({
  selectedRooms,
  assignStaff,
}: {
  selectedRooms: AssignRoom[];
  assignStaff: string;
}) {
  const first = selectedRooms[0];
  return (
    <aside className="roomio-hk-assign-pro__panel">
      <h3>Seçim özeti</h3>
      <dl className="roomio-hk-assign-pro__summary">
        <dt>Seçili oda</dt>
        <dd>{selectedRooms.length > 0 ? selectedRooms.map((r) => r.roomNo).join(', ') : '—'}</dd>
        <dt>Hedef katçı</dt>
        <dd>{assignStaff}</dd>
        {first ? (
          <>
            <dt>Durum</dt>
            <dd>{HK_STATUS_LABELS[first.status]}</dd>
            {first.guest || first.note ? (
              <>
                <dt>Not</dt>
                <dd>
                  {[first.guest, first.note].filter(Boolean).join(' · ') || '—'}
                </dd>
              </>
            ) : null}
          </>
        ) : null}
      </dl>
      <h3>Durum rehberi</h3>
      <div className="roomio-hk-assign-pro__legend">
        <span className="roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--dirty">
          Kirli
        </span>
        <span className="roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--inspect">
          Kontrol
        </span>
        <span className="roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--clean">
          Temiz
        </span>
        <span className="roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--ooo">
          Bakım
        </span>
        <span className="roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--dnd">
          DND
        </span>
      </div>
    </aside>
  );
}

function OperationsView({
  rooms,
  floor,
  setFloor,
  selected,
  toggle,
  assignStaff,
  tab,
  roomHints,
}: {
  rooms: AssignRoom[];
  floor: number;
  setFloor: (f: number) => void;
  selected: Set<string>;
  toggle: (roomNo: string) => void;
  assignStaff: string;
  tab: 'floor' | 'staff' | 'all';
  roomHints?: Record<string, string>;
}) {
  const displayRooms = useMemo(() => {
    if (tab === 'staff') return rooms.filter((r) => r.assignee === assignStaff);
    if (tab === 'all') return rooms;
    return rooms.filter((r) => r.floor === floor);
  }, [rooms, tab, floor, assignStaff]);

  const workCount = displayRooms.filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT').length;

  return (
    <>
      {tab === 'floor' ? (
        <div className="roomio-hk-assign-pro__floor-row">
          <label>Kat</label>
          {[1, 2, 3, 4, 5].map((f) => (
            <button
              key={f}
              type="button"
              className={`roomio-hk-assign-pro__pill${floor === f ? ' is-active' : ''}`}
              onClick={() => setFloor(f)}
            >
              {f}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--pro-muted)' }}>
            Kat {floor} · {workCount} iş odası
          </span>
        </div>
      ) : (
        <div className="roomio-hk-assign-pro__floor-row">
          <span style={{ fontSize: '0.72rem', color: 'var(--pro-muted)' }}>
            {tab === 'staff' ? `${assignStaff} · ${workCount} oda` : `Tüm katlar · ${workCount} iş odası`}
          </span>
        </div>
      )}
      <div className="roomio-hk-assign-pro__grid">
        {displayRooms.map((r) => (
          <button
            key={r.roomNo}
            type="button"
            className={`roomio-hk-assign-pro__room${selected.has(r.roomNo) ? ' is-selected' : ''}`}
            onClick={() => toggle(r.roomNo)}
          >
            <span className="roomio-hk-assign-pro__room-no">
              {tab === 'all' ? `${r.floor}·${r.roomNo}` : r.roomNo}
            </span>
            <span
              className={`roomio-hk-assign-pro__room-status roomio-hk-assign-pro__room-status--${statusSlug(r.status)}`}
            >
              {HK_STATUS_LABELS[r.status]}
            </span>
            {roomHints?.[r.roomNo] ? (
              <span className="roomio-hk-assign-pro__room-hint">{roomHints[r.roomNo]}</span>
            ) : null}
          </button>
        ))}
      </div>
    </>
  );
}

function KanbanView({
  rooms,
  assignStaff,
  onAssign,
  roomHints,
}: {
  rooms: AssignRoom[];
  assignStaff: string;
  onAssign: (roomNo: string, staffName: string | undefined) => void;
  roomHints?: Record<string, string>;
}) {
  const unassigned = rooms.filter((r) => !r.assignee && (r.status === 'DIRTY' || r.status === 'INSPECT'));

  return (
    <>
      <div className="roomio-hk-assign-pro__pool">
        <h4>
          Atanmamış havuz · {unassigned.length} oda → <strong>{assignStaff}</strong>
        </h4>
        <div className="roomio-hk-assign-pro__floor-row">
          {unassigned.length ? (
            unassigned.map((r) => (
              <button
                key={r.roomNo}
                type="button"
                className="roomio-hk-assign-pro__pill"
                title={roomHints?.[r.roomNo]}
                onClick={() => onAssign(r.roomNo, assignStaff)}
              >
                {r.roomNo}
              </button>
            ))
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--pro-muted)' }}>Havuz boş</span>
          )}
        </div>
      </div>
      <div className="roomio-hk-assign-pro__kanban">
        {HK_STAFF.map((s) => {
          const list = rooms.filter((r) => r.assignee === s.name);
          const load = list.length;
          return (
            <div
              key={s.id}
              className={`roomio-hk-assign-pro__col${assignStaff === s.name ? ' is-target' : ''}`}
            >
              <div className="roomio-hk-assign-pro__col-head">
                <strong>{s.name}</strong>
                <span>
                  {load}/14 · Kat {s.floors.join(', ')}
                </span>
                <div className="roomio-hk-assign-pro__meter">
                  <i style={{ width: `${Math.min(100, (load / 14) * 100)}%` }} />
                </div>
              </div>
              <div className="roomio-hk-assign-pro__col-body">
                {list.map((r) => (
                  <div key={r.roomNo} className="roomio-hk-assign-pro__card">
                    <b>{r.roomNo}</b>
                    <p>
                      {HK_STATUS_LABELS[r.status]}
                      {r.note ? ` · ${r.note}` : ''}
                      {roomHints?.[r.roomNo] ? ` · ${roomHints[r.roomNo]}` : ''}
                    </p>
                    <button
                      type="button"
                      className="roomio-hk-assign-pro__assign-tag is-empty"
                      onClick={() => onAssign(r.roomNo, undefined)}
                    >
                      Havuza al
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function QueueView({
  rooms,
  assignMap,
  onCycle,
  roomHints,
}: {
  rooms: AssignRoom[];
  assignMap: Record<string, string>;
  onCycle: (roomNo: string) => void;
  roomHints?: Record<string, string>;
}) {
  const sorted = useMemo(() => {
    const order = { high: 0, med: 1, low: 2 };
    return [...rooms]
      .filter((r) => r.status === 'DIRTY' || r.status === 'INSPECT')
      .sort((a, b) => order[a.priority] - order[b.priority]);
  }, [rooms]);

  return (
    <div className="roomio-hk-assign-pro__queue">
      <div className="roomio-hk-assign-pro__queue-head">
        <span>Öncelik</span>
        <span>Oda / misafir</span>
        <span>Katçı</span>
      </div>
      {sorted.map((r) => {
        const assignee = assignMap[r.roomNo];
        return (
          <div key={r.roomNo} className="roomio-hk-assign-pro__queue-row">
            <span className={`roomio-hk-assign-pro__prio roomio-hk-assign-pro__prio--${r.priority}`}>
              {PRIORITY_LABELS[r.priority]}
            </span>
            <div className="roomio-hk-assign-pro__queue-main">
              <strong>
                {r.roomNo} · {HK_STATUS_LABELS[r.status]}
              </strong>
              <span>
                {r.guest ?? 'Boş'}
                {r.note ? ` · ${r.note}` : ''}
                {roomHints?.[r.roomNo] ? ` · ${roomHints[r.roomNo]}` : ''}
              </span>
            </div>
            <button
              type="button"
              className={`roomio-hk-assign-pro__assign-tag${assignee ? '' : ' is-empty'}`}
              onClick={() => onCycle(r.roomNo)}
            >
              {assignee ?? 'Ata →'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export type HkAssignProAppProps = {
  embedded?: boolean;
  rooms: AssignRoom[];
  setRooms: React.Dispatch<React.SetStateAction<AssignRoom[]>>;
  loading?: boolean;
  error?: string | null;
  assignBusy?: boolean;
  totalRooms?: number;
  onRefresh?: () => void;
  onPersistAssign?: (roomNos: string[], staffName: string | null) => Promise<void>;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onPrintStaffReport?: (staffName: string) => void;
  roomHints?: Record<string, string>;
};

function formatToday() {
  return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** HK Atama — profesyonel operasyon paneli */
export function HkAssignProApp({
  embedded = false,
  rooms,
  setRooms,
  loading = false,
  error = null,
  assignBusy = false,
  totalRooms,
  onRefresh,
  onPersistAssign,
  onExportCsv,
  onExportPdf,
  onPrintStaffReport,
  roomHints,
}: HkAssignProAppProps) {
  const [mode, setMode] = useState<ViewMode>('operations');
  const [floor, setFloor] = useState(1);
  const [tab, setTab] = useState<'floor' | 'staff' | 'all'>('floor');
  const [selected, setSelected] = useState<Set<string>>(
    () => (embedded ? new Set() : new Set(['104', '108', '110'])),
  );
  const [assignStaff, setAssignStaff] = useState(HK_STAFF[0]?.name ?? 'Elif K.');
  const [search, setSearch] = useState('');

  const assignMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of rooms) {
      if (r.assignee) map[r.roomNo] = r.assignee;
    }
    return map;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.trim().toLowerCase();
    return rooms.filter(
      (r) =>
        r.roomNo.includes(q) ||
        r.guest?.toLowerCase().includes(q) ||
        r.assignee?.toLowerCase().includes(q) ||
        r.note?.toLowerCase().includes(q),
    );
  }, [rooms, search]);

  const kpis = useKpis(rooms, totalRooms ?? rooms.length);
  const selectedRooms = rooms.filter((r) => selected.has(r.roomNo));
  const activeMode = MODES.find((m) => m.id === mode)!;
  const dateLabel = formatToday();

  function toggle(roomNo: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roomNo)) next.delete(roomNo);
      else next.add(roomNo);
      return next;
    });
  }

  async function assignTo(roomNo: string, staffName: string | undefined) {
    if (embedded && onPersistAssign) {
      await onPersistAssign([roomNo], staffName ?? null);
      return;
    }
    setRooms((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, assignee: staffName } : r)));
  }

  async function cycleAssign(roomNo: string) {
    const names = HK_STAFF.map((s) => s.name);
    const current = rooms.find((r) => r.roomNo === roomNo)?.assignee;
    const idx = current ? names.indexOf(current) : -1;
    const next = names[(idx + 1) % names.length];
    if (embedded && onPersistAssign) {
      await onPersistAssign([roomNo], next);
      return;
    }
    setRooms((prev) => prev.map((r) => (r.roomNo === roomNo ? { ...r, assignee: next } : r)));
  }

  async function handleAssignSelected() {
    if (mode !== 'operations' || !selected.size) return;
    const roomNos = [...selected];
    if (embedded && onPersistAssign) {
      await onPersistAssign(roomNos, assignStaff);
      setSelected(new Set());
      return;
    }
    setRooms((prev) =>
      prev.map((r) => (roomNos.includes(r.roomNo) ? { ...r, assignee: assignStaff } : r)),
    );
    setSelected(new Set());
  }

  function handleFooterAction() {
    if (mode === 'operations') {
      void handleAssignSelected();
      return;
    }
    onExportCsv?.();
  }

  return (
    <div className={`roomio-hk-assign-pro${embedded ? ' roomio-hk-assign-pro--embedded' : ''}`}>
      {!embedded ? (
        <>
          <nav className="roomio-hk-assign-pro__nav" aria-label="Mockup gezinme">
            <a href="/housekeeping/assign" className="roomio-hk-assign-pro__nav-back">
              Mevcut atama ekranı
            </a>
            <span className="roomio-hk-assign-pro__nav-title">HK Atama Mockup</span>
          </nav>
          <div className="roomio-hk-assign-pro__ribbon">
            <Sparkles size={12} />
            Tasarım mockup
            <span>·</span>
            Etkileşimli prototip · Demo veri
          </div>
        </>
      ) : null}

      <div className="roomio-hk-assign-pro__shell">
        {!embedded ? (
          <header className="roomio-hk-assign-pro__intro">
            <h1>HK Atama — Operasyon Merkezi</h1>
            <p>
              Süpervizörler için kurumsal atama paneli. Kat bazlı dağıtım, kanban iş yükü dengesi veya öncelik
              kuyruğu — aynı veri modeli, üç profesyonel görünüm.
            </p>
          </header>
        ) : null}

        <div className="roomio-hk-assign-pro__modes" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              className={`roomio-hk-assign-pro__mode${mode === m.id ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <strong>{m.title}</strong>
              <em>{m.blurb}</em>
            </button>
          ))}
        </div>

        <div className="roomio-hk-assign-pro__app">
          <header className="roomio-hk-assign-pro__app-head">
            <div className="roomio-hk-assign-pro__app-brand">
              <div className="roomio-hk-assign-pro__app-logo">HK</div>
              <div>
                <h2>Atama & Rapor</h2>
                <small>Roomio · Kat Hizmetleri · {dateLabel}</small>
              </div>
            </div>
            <div className="roomio-hk-assign-pro__app-actions">
              <button
                type="button"
                className="roomio-hk-assign-pro__icon-btn"
                aria-label="Excel"
                onClick={() => onExportCsv?.()}
                disabled={embedded && !onExportCsv}
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                type="button"
                className="roomio-hk-assign-pro__icon-btn"
                aria-label="PDF"
                onClick={() => onExportPdf?.()}
                disabled={embedded && !onExportPdf}
              >
                <FileText size={16} />
              </button>
              <button
                type="button"
                className="roomio-hk-assign-pro__icon-btn"
                aria-label="Katçı raporu yazdır"
                onClick={() => onPrintStaffReport?.(assignStaff)}
                disabled={embedded && !onPrintStaffReport}
                title={`${assignStaff} raporu`}
              >
                <Printer size={16} />
              </button>
              <button
                type="button"
                className="roomio-hk-assign-pro__icon-btn"
                aria-label="Yenile"
                onClick={() => onRefresh?.()}
                disabled={(embedded && !onRefresh) || loading}
              >
                <RefreshCw size={16} className={loading ? 'roomio-spin' : undefined} />
              </button>
            </div>
          </header>

          {error ? (
            <p className="roomio-hk-assign-pro__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="roomio-hk-assign-pro__toolbar">
            <label className="roomio-hk-assign-pro__search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Oda, misafir veya katçı ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                readOnly={!embedded}
              />
            </label>
            <select className="roomio-hk-assign-pro__select" defaultValue="today" aria-label="Tarih">
              <option value="today">Bugün</option>
              <option value="tomorrow">Yarın</option>
            </select>
            {mode === 'operations' ? (
              <div className="roomio-hk-assign-pro__seg" role="tablist">
                {(
                  [
                    ['floor', 'Kat'],
                    ['staff', 'Katçı'],
                    ['all', 'Tümü'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={tab === id ? 'is-active' : ''}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="roomio-hk-assign-pro__kpis">
            <div className="roomio-hk-assign-pro__kpi">
              <span className="roomio-hk-assign-pro__kpi-icon roomio-hk-assign-pro__kpi-icon--work">
                <Wrench size={18} />
              </span>
              <div>
                <b>{kpis.work}</b>
                <span>İş odası</span>
              </div>
            </div>
            <div className="roomio-hk-assign-pro__kpi">
              <span className="roomio-hk-assign-pro__kpi-icon roomio-hk-assign-pro__kpi-icon--open">
                <ClipboardList size={18} />
              </span>
              <div>
                <b>{kpis.unassigned}</b>
                <span>Atanmamış</span>
              </div>
            </div>
            <div className="roomio-hk-assign-pro__kpi">
              <span className="roomio-hk-assign-pro__kpi-icon roomio-hk-assign-pro__kpi-icon--staff">
                <Users size={18} />
              </span>
              <div>
                <b>{kpis.staff}</b>
                <span>Aktif katçı</span>
              </div>
            </div>
            <div className="roomio-hk-assign-pro__kpi">
              <span className="roomio-hk-assign-pro__kpi-icon roomio-hk-assign-pro__kpi-icon--clean">
                <BedDouble size={18} />
              </span>
              <div>
                <b>{kpis.clean}</b>
                <span>{embedded ? 'Temiz' : 'Temiz (demo)'}</span>
              </div>
            </div>
            <div className="roomio-hk-assign-pro__kpi">
              <span className="roomio-hk-assign-pro__kpi-icon roomio-hk-assign-pro__kpi-icon--total">
                <Sparkles size={18} />
              </span>
              <div>
                <b>{kpis.total}</b>
                <span>Toplam oda</span>
              </div>
            </div>
          </div>

          <div className="roomio-hk-assign-pro__body">
            <StaffSidebar activeStaff={assignStaff} onSelect={setAssignStaff} rooms={rooms} />

            <main className="roomio-hk-assign-pro__main">
              {loading && embedded ? (
                <p className="roomio-hk-assign-pro__loading">Yükleniyor…</p>
              ) : null}
              {!loading || !embedded ? (
                <>
                  {mode === 'operations' ? (
                    <OperationsView
                      rooms={filteredRooms}
                      floor={floor}
                      setFloor={setFloor}
                      selected={selected}
                      toggle={toggle}
                      assignStaff={assignStaff}
                      tab={tab}
                      roomHints={roomHints}
                    />
                  ) : null}
                  {mode === 'kanban' ? (
                    <KanbanView
                      rooms={filteredRooms}
                      assignStaff={assignStaff}
                      onAssign={(roomNo, staff) => void assignTo(roomNo, staff)}
                      roomHints={roomHints}
                    />
                  ) : null}
                  {mode === 'queue' ? (
                    <QueueView
                      rooms={filteredRooms}
                      assignMap={assignMap}
                      onCycle={(roomNo) => void cycleAssign(roomNo)}
                      roomHints={roomHints}
                    />
                  ) : null}
                </>
              ) : null}
            </main>

            {mode === 'operations' ? (
              <DetailPanel selectedRooms={selectedRooms} assignStaff={assignStaff} />
            ) : null}
          </div>

          <footer className="roomio-hk-assign-pro__foot">
            <p className="roomio-hk-assign-pro__foot-meta">
              {mode === 'operations' ? (
                <>
                  <strong>{selected.size}</strong> oda seçili → <strong>{assignStaff}</strong>
                </>
              ) : mode === 'kanban' ? (
                <>Karta tıklayarak katçıya atayın veya havuza geri alın</>
              ) : (
                <>Ata chip&apos;ine tıklayarak sıradaki katçıya geçin</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {mode === 'operations' ? (
                <button
                  type="button"
                  className="roomio-hk-assign-pro__cta roomio-hk-assign-pro__cta--ghost"
                  onClick={() => setSelected(new Set())}
                >
                  İptal
                </button>
              ) : null}
              <button
                type="button"
                className="roomio-hk-assign-pro__cta"
                disabled={assignBusy || (mode === 'operations' && !selected.size)}
                onClick={handleFooterAction}
              >
                {assignBusy
                  ? 'Kaydediliyor…'
                  : mode === 'operations'
                    ? 'Seçilenleri ata'
                    : 'Raporu dışa aktar'}
              </button>
            </div>
          </footer>
        </div>

        {!embedded ? (
          <section className="roomio-hk-assign-pro__notes">
            <h3>{activeMode.title} — tasarım notları</h3>
            <ul>
              {mode === 'operations' ? (
                <>
                  <li>Üç sütunlu düzen: katçı listesi, kat ızgarası, seçim özeti</li>
                  <li>Koyu başlık çubuğu ve KPI şeridi — operasyon odaklı kurumsal görünüm</li>
                  <li>Mevcut mobil atama akışıyla uyumlu Kat · Katçı · Tümü sekmeleri</li>
                </>
              ) : null}
              {mode === 'kanban' ? (
                <>
                  <li>Katçı başına iş yükü çubuğu — dengesiz dağılım anında görünür</li>
                  <li>Atanmamış havuz üstte; sabah briefing için ideal</li>
                  <li>Kart tabanlı görsel atama — sürükle-bırak üretimde eklenebilir</li>
                </>
              ) : null}
              {mode === 'queue' ? (
                <>
                  <li>Çıkış önceliği ile sıralı tablo — rush saatlerinde hızlı karar</li>
                  <li>Tek satırda oda, misafir ve not bilgisi</li>
                  <li>Tek dokunuşla katçı döngüsü — yoğun oteller için süpervizör odaklı</li>
                </>
              ) : null}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** HK Atama — profesyonel mockup */
export function HkAssignProMockup() {
  const [rooms, setRooms] = useState(DEMO_ROOMS);
  return <HkAssignProApp rooms={rooms} setRooms={setRooms} />;
}