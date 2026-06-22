import { CheckCircle2, ClipboardCheck, Sparkles, Wrench } from 'lucide-react';
import { StatTile } from '@/components/kit';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { FLOORS } from '@/lib/rooms/room-config';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

type Props = {
  board: HousekeepingBoardRow[];
  selectedFloor: number | 'ALL';
  onFloorChange: (floor: number | 'ALL') => void;
  selectedRoom: string | null;
  onRoomSelect: (roomNo: string | null) => void;
  onStatusChange: (roomNo: string, status: HousekeepingBoardRow['status']) => void;
  savingRoom: string | null;
  variant?: 'default' | 'mobile';
};

const HK_STAFF = [
  { id: 'm01', name: 'Ayşe', floors: 'Kat 1–2', active: true },
  { id: 'm02', name: 'Fatma', floors: 'Kat 3–4', active: true },
];

function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function countByStatus(board: HousekeepingBoardRow[]) {
  return {
    clean: board.filter((r) => r.status === 'CLEAN').length,
    dirty: board.filter((r) => r.status === 'DIRTY').length,
    inspect: board.filter((r) => r.status === 'INSPECT').length,
    maint: board.filter((r) => r.status === 'OOO' || r.status === 'DND').length,
  };
}

function floorCounts(board: HousekeepingBoardRow[]) {
  return FLOORS.map(({ floor }) => ({
    floor,
    count: board.filter((r) => r.floor === floor).length,
  }));
}

export function HousekeepingPano({
  board,
  selectedFloor,
  onFloorChange,
  selectedRoom,
  onRoomSelect,
  onStatusChange,
  savingRoom,
  variant = 'default',
}: Props) {
  const counts = countByStatus(board);
  const floors = floorCounts(board);
  const isMobile = variant === 'mobile';
  const visibleFloors = selectedFloor === 'ALL'
    ? FLOORS
    : FLOORS.filter((f) => f.floor === selectedFloor);

  return (
    <div className={`roomio-hk-pano${isMobile ? ' roomio-hk-pano--mobile' : ''}`}>
      <div className="roomio-hk-pano__head">
        <h2 className="roomio-hk-pano__title">
          {isMobile ? `${board.length} Oda` : `Housekeeping Pano — ${board.length} Oda`}
        </h2>
        <div className="roomio-kpi-strip roomio-hk-pano__kpi">
          <StatTile label="Temiz" value={String(counts.clean)} icon={Sparkles} className="roomio-hk-kpi--clean" />
          <StatTile label="Kirli" value={String(counts.dirty)} icon={ClipboardCheck} className="roomio-hk-kpi--dirty" />
          <StatTile label="Kontrol" value={String(counts.inspect)} icon={CheckCircle2} className="roomio-hk-kpi--inspect" />
          <StatTile label="Bakım" value={String(counts.maint)} icon={Wrench} className="roomio-hk-kpi--maint" />
        </div>
      </div>

      <div className="roomio-hk-pano__floor-tabs" role="tablist" aria-label="Kat seçimi">
        <button
          type="button"
          role="tab"
          className={`roomio-hk-floor-tab${selectedFloor === 'ALL' ? ' is-active' : ''}`}
          onClick={() => onFloorChange('ALL')}
        >
          Tüm katlar
        </button>
        {floors.map(({ floor, count }) => (
          <button
            key={floor}
            type="button"
            role="tab"
            className={`roomio-hk-floor-tab${selectedFloor === floor ? ' is-active' : ''}`}
            onClick={() => onFloorChange(floor)}
          >
            Kat {floor} ({count})
          </button>
        ))}
      </div>

      <div className="roomio-hk-pano__body">
        <div className="roomio-hk-pano__grid-wrap">
          {visibleFloors.map(({ floor }) => {
            const rooms = board.filter((r) => r.floor === floor);
            return (
              <div key={floor} className="roomio-hk-floor-row">
                <div className="roomio-hk-floor-row__label">Kat {floor}</div>
                <div className="roomio-hk-mini-grid">
                  {rooms.map((room) => (
                    <button
                      key={room.roomNo}
                      type="button"
                      className={`roomio-hk-mini-cell roomio-hk-mini-cell--${room.status.toLowerCase()}${selectedRoom === room.roomNo ? ' is-selected' : ''}`}
                      onClick={() => onRoomSelect(room.roomNo)}
                      title={`${room.roomNo} · ${HK_STATUS_LABELS[room.status]}${room.guestName ? ` · ${room.guestName}` : ''}`}
                    >
                      {room.roomNo}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="roomio-hk-legend">
            {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
              <span key={s} className={`roomio-hk-legend-item roomio-hk-mini-cell--${s.toLowerCase()}`}>
                {HK_STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </div>

        {!isMobile ? (
        <aside className="roomio-hk-pano__side">
          <div className="roomio-card roomio-hk-side-card">
            <h3 className="roomio-card-title">Kat Görevlileri</h3>
            <ul className="roomio-hk-staff-list">
              {HK_STAFF.map((s) => (
                <li key={s.id}>
                  <span className="roomio-hk-staff-id">{s.id.toUpperCase()}</span>
                  <span>{s.name}</span>
                  <small>{s.floors}</small>
                  <span className={`roomio-hk-staff-dot${s.active ? ' is-active' : ''}`} aria-label={s.active ? 'Aktif' : 'Pasif'} />
                </li>
              ))}
            </ul>
          </div>

          {selectedRoom ? (
            <SelectedRoomPanel
              room={board.find((r) => r.roomNo === selectedRoom)!}
              saving={savingRoom === selectedRoom}
              onStatusChange={onStatusChange}
            />
          ) : (
            <div className="roomio-card roomio-hk-side-card roomio-hk-side-hint">
              <p>Bir odayı seçerek durumunu güncelleyebilir veya kontrol ataması yapabilirsiniz.</p>
            </div>
          )}

          <div className="roomio-hk-side-actions">
            <button
              type="button"
              className="roomio-btn roomio-btn--primary roomio-hk-action-btn"
              disabled={!selectedRoom || savingRoom === selectedRoom}
              onClick={() => selectedRoom && onStatusChange(selectedRoom, 'CLEAN')}
            >
              Oda Temizlendi
            </button>
            <button
              type="button"
              className="roomio-btn roomio-btn--secondary roomio-hk-action-btn"
              disabled={!selectedRoom || savingRoom === selectedRoom}
              onClick={() => selectedRoom && onStatusChange(selectedRoom, 'INSPECT')}
            >
              HK Kontrol
            </button>
          </div>
        </aside>
        ) : null}
      </div>

      {isMobile && selectedRoom ? (
        <MobileRoomBar
          room={board.find((r) => r.roomNo === selectedRoom)!}
          saving={savingRoom === selectedRoom}
          onStatusChange={onStatusChange}
          onClose={() => onRoomSelect(null)}
        />
      ) : null}
    </div>
  );
}

function MobileRoomBar({
  room,
  saving,
  onStatusChange,
  onClose,
}: {
  room: HousekeepingBoardRow;
  saving: boolean;
  onStatusChange: (roomNo: string, status: HousekeepingBoardRow['status']) => void;
  onClose: () => void;
}) {
  if (!room) return null;

  return (
    <div className="roomio-hk-mobile-room-bar">
      <div className="roomio-hk-mobile-room-bar__info">
        <strong>Oda {room.roomNo}</strong>
        <span>{HK_STATUS_LABELS[room.status]}</span>
      </div>
      <div className="roomio-hk-mobile-room-bar__actions">
        <button
          type="button"
          className="roomio-btn roomio-btn--primary roomio-btn--sm"
          disabled={saving}
          onClick={() => onStatusChange(room.roomNo, 'CLEAN')}
        >
          Temiz
        </button>
        <button
          type="button"
          className="roomio-btn roomio-btn--secondary roomio-btn--sm"
          disabled={saving}
          onClick={() => onStatusChange(room.roomNo, 'INSPECT')}
        >
          Kontrol
        </button>
        <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}

function SelectedRoomPanel({
  room,
  saving,
  onStatusChange,
}: {
  room: HousekeepingBoardRow;
  saving: boolean;
  onStatusChange: (roomNo: string, status: HousekeepingBoardRow['status']) => void;
}) {
  if (!room) return null;

  return (
    <div className="roomio-card roomio-hk-side-card">
      <h3 className="roomio-card-title">Oda {room.roomNo}</h3>
      <dl className="roomio-dl roomio-dl--compact">
        <dt>Kat / Tip</dt><dd>{room.floor}. Kat · {room.type}</dd>
        <dt>Durum</dt><dd>{HK_STATUS_LABELS[room.status]}</dd>
        <dt>Misafir</dt><dd>{room.guestName ?? '—'}</dd>
        <dt>Giriş / Çıkış</dt><dd>{formatDate(room.checkIn)} / {formatDate(room.checkOut)}</dd>
        <dt>Personel</dt><dd>{room.assignedTo ?? '—'}</dd>
      </dl>
      <label className="roomio-field" style={{ marginTop: 12 }}>
        <span>Durum güncelle</span>
        <select
          className="roomio-select"
          value={room.status}
          disabled={saving}
          onChange={(e) => onStatusChange(room.roomNo, e.target.value as HousekeepingBoardRow['status'])}
        >
          {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
            <option key={s} value={s}>{HK_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function HkStatusDots({ status }: { status: HousekeepingBoardRow['status'] }) {
  const cols: { key: HousekeepingBoardRow['status']; label: string }[] = [
    { key: 'CLEAN', label: 'Temiz' },
    { key: 'DIRTY', label: 'Kirli' },
    { key: 'INSPECT', label: 'Kontrol' },
  ];

  return (
    <div className="roomio-hk-dot-row" aria-label={`HK durumu: ${HK_STATUS_LABELS[status]}`}>
      {cols.map((col) => (
        <span
          key={col.key}
          className={`roomio-hk-dot${status === col.key ? ' is-active' : ''} roomio-hk-dot--${col.key.toLowerCase()}`}
          title={col.label}
        />
      ))}
    </div>
  );
}

export function HkToolbar({ total, onRefresh }: { total: number; onRefresh: () => void }) {
  return (
    <div className="roomio-hk-toolbar">
      <span>Toplam {total} oda</span>
      <div className="roomio-hk-toolbar__actions">
        <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={onRefresh}>
          Yenile
        </button>
        <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm">Excel&apos;e Aktar</button>
      </div>
    </div>
  );
}

export function HkFilterBar({
  floor,
  status,
  onFloor,
  onStatus,
  search,
  onSearch,
}: {
  floor: number | 'ALL';
  status: HousekeepingBoardRow['status'] | 'ALL';
  onFloor: (f: number | 'ALL') => void;
  onStatus: (s: HousekeepingBoardRow['status'] | 'ALL') => void;
  search: string;
  onSearch: (q: string) => void;
}) {
  return (
    <div className="roomio-hk-filters">
      <div className="roomio-hk-filters__row">
        <label className="roomio-field">
          <span>Kat</span>
          <select className="roomio-select" value={floor === 'ALL' ? 'ALL' : String(floor)} onChange={(e) => onFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
            <option value="ALL">Tümü</option>
            {FLOORS.map(({ floor: f }) => <option key={f} value={f}>{f}. Kat</option>)}
          </select>
        </label>
        <label className="roomio-field">
          <span>HK Durumu</span>
          <select className="roomio-select" value={status} onChange={(e) => onStatus(e.target.value as HousekeepingBoardRow['status'] | 'ALL')}>
            <option value="ALL">Tümü</option>
            {(['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const).map((s) => (
              <option key={s} value={s}>{HK_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="roomio-field roomio-field--grow">
          <span>Oda No / Misafir</span>
          <input
            className="roomio-input"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Ara…"
          />
        </label>
        <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={() => { onFloor(floor); onStatus(status); }}>
          Filtrele
        </button>
        <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={() => { onFloor('ALL'); onStatus('ALL'); onSearch(''); }}>
          Temizle
        </button>
      </div>
    </div>
  );
}
