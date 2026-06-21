'use client';

import { useMemo, useState } from 'react';
import { Clock, Hand, User, Wrench } from 'lucide-react';
import { FLOORS, countTotalRooms } from '@/lib/rooms/room-config';
import { buildRackCells, countRackByState, getRoomTypesList } from '@/lib/rooms/inventory';
import {
  getRackDisplay,
  getElektraStatusLabel,
  RACK_DISPLAY_LEGEND,
  rackStatsFromCounts,
  type RackDisplayContext,
  type RackDisplayIcon,
} from '@/lib/rooms/rack-display';
import type { RoomTypeCode } from '@/lib/rooms/room-types';
import type { RackCell, RackCellState } from '@/lib/types/room';
import type { Reservation } from '@/lib/types/reservation';
import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { PROPERTY } from '@/lib/navigation';
import { HK_STATUS_LABELS } from '@/lib/types/room';
import { RackElektraToolbar, RackStatsFooter } from '@/components/rack/RackElektraToolbar';

type Props = {
  preview?: boolean;
  defaultFloor?: number | 'all';
  maxCells?: number;
  activeFloor?: number | 'all';
  onFloorChange?: (floor: number | 'all') => void;
  reservations?: Reservation[];
  businessDate?: string;
  hkMap?: Record<string, import('@/lib/data/hk-defaults').HkRoomRecord>;
  elektra?: boolean;
  onRefresh?: () => void;
};

function applyFilters(
  source: RackCell[],
  filters: {
    stateFilter: RackCellState | 'all';
    typeFilter: RoomTypeCode | 'all';
    locationFilter: 'all' | 'sol' | 'sag';
    occupiedOnly: boolean;
    cleanOnly: boolean;
    showMaintenance: boolean;
  },
): RackCell[] {
  let all = source;
  if (filters.stateFilter !== 'all') all = all.filter((c) => c.state === filters.stateFilter);
  if (filters.typeFilter !== 'all') all = all.filter((c) => c.room.typeCode === filters.typeFilter);
  if (filters.locationFilter === 'sol') all = all.filter((c) => c.room.suffix <= 9);
  if (filters.locationFilter === 'sag') all = all.filter((c) => c.room.suffix > 9);
  if (filters.occupiedOnly) all = all.filter((c) => c.occupied);
  if (filters.cleanOnly) {
    all = all.filter((c) => c.state === 'temiz' || c.state === 'dolu-temiz' || c.state === 'onayli');
  }
  if (!filters.showMaintenance) {
    all = all.filter((c) => c.state !== 'ooi' && c.state !== 'ariza');
  }
  return all;
}

function RackIcon({ kind }: { kind: RackDisplayIcon }) {
  const props = { size: 11, strokeWidth: 2.25 };
  if (kind === 'person') return <User {...props} />;
  if (kind === 'clock') return <Clock {...props} />;
  if (kind === 'hand') return <Hand {...props} />;
  if (kind === 'wrench') return <Wrench {...props} />;
  return null;
}

function RackPreviewCell({ cell, ctx }: { cell: RackCell; ctx: RackDisplayContext }) {
  const display = getRackDisplay(cell, ctx);

  return (
    <button
      type="button"
      className="roomio-nr-cell roomio-nr-cell--preview"
      style={{
        background: display.color,
        color: display.text,
        borderColor: display.border,
      }}
      title={`${cell.room.roomNo} · ${display.label}${display.sub ? ` · ${display.sub}` : ''}`}
    >
      <span className="roomio-nr-cell-top">
        <span className="roomio-nr-cell-no">{cell.room.roomNo}</span>
        {display.icon !== 'none' ? (
          <span className="roomio-nr-cell-icon" aria-hidden>
            <RackIcon kind={display.icon} />
          </span>
        ) : null}
      </span>
      <span className="roomio-nr-cell-status">{display.label}</span>
      {display.sub ? <span className="roomio-nr-cell-guest">{display.sub}</span> : null}
      {display.time ? <span className="roomio-nr-cell-time">{display.time}</span> : null}
    </button>
  );
}

function RackCellButton({
  cell,
  selected,
  onSelect,
  ctx,
  elektra = false,
}: {
  cell: RackCell;
  selected: boolean;
  onSelect: (cell: RackCell) => void;
  ctx: RackDisplayContext;
  elektra?: boolean;
}) {
  const display = getRackDisplay(cell, ctx);
  return (
    <button
      type="button"
      className={`roomio-nr-cell${selected ? ' is-selected' : ''}${elektra ? ' roomio-nr-cell--elektra' : ''}`}
      style={{
        background: display.color,
        color: display.text,
        borderColor: display.border,
      }}
      onClick={() => onSelect(cell)}
      title={`${cell.room.roomNo} · ${display.label}${display.sub ? ` · ${display.sub}` : ''}`}
    >
      <span className="roomio-nr-cell-top">
        <span className="roomio-nr-cell-no">{cell.room.roomNo}</span>
        <span className="roomio-nr-cell-icon" aria-hidden>
          <RackIcon kind={display.icon} />
        </span>
      </span>
      {elektra ? (
        <>
          <span className="roomio-nr-cell-type">{cell.room.typeShort}</span>
          <span className="roomio-nr-cell-status">{getElektraStatusLabel(display)}</span>
          <span className="roomio-nr-cell-hk">{HK_STATUS_LABELS[cell.room.hkStatus]}</span>
        </>
      ) : (
        <>
          <span className="roomio-nr-cell-status">{display.label}</span>
          {display.time ? <span className="roomio-nr-cell-time">{display.time}</span> : null}
          {display.sub ? <span className="roomio-nr-cell-guest">{display.sub}</span> : null}
        </>
      )}
    </button>
  );
}

export function RoomRackGrid({
  preview = false,
  defaultFloor = 'all',
  maxCells,
  activeFloor,
  onFloorChange,
  reservations: reservationsProp,
  businessDate: businessDateProp,
  hkMap: hkMapProp,
  elektra = false,
  onRefresh,
}: Props) {
  const reservations = reservationsProp ?? DEMO_RESERVATIONS;
  const businessDate = businessDateProp ?? PROPERTY.businessDate;
  const hkMap = hkMapProp ?? DEFAULT_HK_ROOMS;
  const displayCtx: RackDisplayContext = { businessDate, reservations };
  const buildCells = (f?: number) => buildRackCells(f, reservations, businessDate, hkMap);
  const [internalFloor, setInternalFloor] = useState<number | 'all'>(defaultFloor);
  const floorControlled = activeFloor !== undefined && onFloorChange !== undefined;
  const floor = floorControlled ? activeFloor : internalFloor;
  const setFloor = floorControlled ? onFloorChange : setInternalFloor;
  const [stateFilter, setStateFilter] = useState<RackCellState | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RoomTypeCode | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | 'sol' | 'sag'>('all');
  const [occupiedOnly, setOccupiedOnly] = useState(false);
  const [cleanOnly, setCleanOnly] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [viewMode, setViewMode] = useState<'roomNo' | 'type'>('roomNo');
  const [selected, setSelected] = useState<RackCell | null>(null);
  const [columns, setColumns] = useState(17);
  const [autoFit, setAutoFit] = useState(true);

  const filterState = { stateFilter, typeFilter, locationFilter, occupiedOnly, cleanOnly, showMaintenance };
  const separateFloors = floor === 'all';

  const floorSections = useMemo(() => {
    if (!separateFloors) return null;
    return FLOORS.map(({ floor: f }) => ({
      floor: f,
      cells: applyFilters(buildCells(f), filterState),
    }));
  }, [separateFloors, stateFilter, typeFilter, locationFilter, occupiedOnly, cleanOnly, showMaintenance, reservations, businessDate, hkMap]);

  const singleCells = useMemo(() => {
    const base = buildCells(typeof floor === 'number' ? floor : undefined);
    const filtered = applyFilters(base, filterState);
    return maxCells ? filtered.slice(0, maxCells) : filtered;
  }, [floor, stateFilter, typeFilter, locationFilter, occupiedOnly, cleanOnly, showMaintenance, maxCells, reservations, businessDate, hkMap]);

  const counts = useMemo(
    () => countRackByState(buildCells(floor === 'all' ? undefined : floor)),
    [floor, reservations, businessDate, hkMap],
  );

  const totalVisible = separateFloors
    ? (floorSections?.reduce((sum, s) => sum + s.cells.length, 0) ?? 0)
    : singleCells.length;

  const gridStyle = {
    '--roomio-nr-cols': columns,
    '--roomio-nr-min': separateFloors ? '68px' : '112px',
  } as React.CSSProperties;

  const stats = useMemo(
    () => rackStatsFromCounts(counts as Record<string, number>, countTotalRooms()),
    [counts],
  );

  const renderGrid = (sectionCells: RackCell[], keyPrefix = '') => (
    <div
      className={`roomio-nr-grid${autoFit ? '' : ' roomio-nr-grid--fixed'}${elektra ? ' roomio-nr-grid--elektra' : ''}`}
      style={gridStyle}
    >
      {sectionCells.map((cell) => (
        <RackCellButton
          key={`${keyPrefix}${cell.room.roomNo}`}
          cell={cell}
          selected={selected?.room.roomNo === cell.room.roomNo}
          onSelect={setSelected}
          ctx={displayCtx}
          elektra={elektra}
        />
      ))}
    </div>
  );

  if (preview) {
    const sections = FLOORS.map(({ floor: f }) => ({
      floor: f,
      cells: buildCells(f),
    }));
    const visibleSections = floor === 'all'
      ? sections
      : sections.filter((section) => section.floor === floor);
    const soloFloor = floor !== 'all';

    return (
      <div className="roomio-nr-shell roomio-nr-shell--preview">
        <div className="roomio-nr-legend">
          {RACK_DISPLAY_LEGEND.map((item) => (
            <span
              key={item.label}
              className="roomio-nr-legend-item"
              style={{ background: item.color, color: item.text }}
            >
              {item.label}
            </span>
          ))}
        </div>
        <div className="roomio-nr-board">
          {visibleSections.map((section) => (
            <section
              key={section.floor}
              className={`roomio-nr-floor${soloFloor ? ' roomio-nr-floor--solo' : ''}`}
            >
              <div className="roomio-nr-floor-head">
                <span className="roomio-nr-floor-title">{section.floor}. Kat ›</span>
                <span className="roomio-nr-floor-meta">{section.cells.length} oda</span>
              </div>
              <div
                className="roomio-nr-grid roomio-nr-grid--preview"
                style={{
                  '--roomio-nr-cols': section.cells.length,
                } as React.CSSProperties}
              >
                {section.cells.map((cell) => (
                  <RackPreviewCell key={cell.room.roomNo} cell={cell} ctx={displayCtx} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`roomio-nr-shell${elektra ? ' roomio-nr-shell--elektra' : ''}`}>
      {elektra ? (
        <RackElektraToolbar
          businessDate={businessDate}
          floor={floor}
          onFloorChange={setFloor}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cleanOnly={cleanOnly}
          onCleanOnlyChange={setCleanOnly}
          showMaintenance={showMaintenance}
          onShowMaintenanceChange={setShowMaintenance}
          onRefresh={onRefresh}
        />
      ) : null}

      <div className="roomio-nr-legend">
        {RACK_DISPLAY_LEGEND.map((item) => (
          <button
            key={item.label}
            type="button"
            className="roomio-nr-legend-item"
            style={{ background: item.color, color: item.text }}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {!elektra ? (
      <div className="roomio-nr-toolbar">
        <div className="roomio-nr-floor-tabs">
          <button
            type="button"
            className={`roomio-nr-floor-tab${floor === 'all' ? ' is-active' : ''}`}
            onClick={() => setFloor('all')}
          >
            Tümü
          </button>
          {FLOORS.map(({ floor: f }) => (
            <button
              key={f}
              type="button"
              className={`roomio-nr-floor-tab${floor === f ? ' is-active' : ''}`}
              onClick={() => setFloor(f)}
            >
              {f}. Kat
            </button>
          ))}
        </div>

        <label className="roomio-nr-field">
          <span>Kolon</span>
          <input
            type="number"
            min={8}
            max={24}
            value={columns}
            onChange={(e) => setColumns(Math.max(8, Math.min(24, Number(e.target.value) || 17)))}
          />
        </label>
        <label className="roomio-nr-check">
          <input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} />
          Otomatik sığdır
        </label>
      </div>
      ) : null}

      <div className="roomio-nr-board">
        <div className="roomio-nr-summary">
          {floor === 'all'
            ? `Tüm katlar — ${totalVisible} / ${countTotalRooms()} oda görünüyor · 5 kat bölümü`
            : `${floor}. Kat — ${totalVisible} oda`}
        </div>

        {separateFloors && floorSections ? (
          floorSections.map((section) => (
            <section key={section.floor} className="roomio-nr-floor">
              <div className="roomio-nr-floor-head">
                <span className="roomio-nr-floor-title">{elektra ? `${section.floor}. KAT` : `${section.floor}. Kat ›`}</span>
                <span className="roomio-nr-floor-meta">{section.cells.length} oda</span>
              </div>
              {renderGrid(section.cells, `${section.floor}-`)}
            </section>
          ))
        ) : (
          renderGrid(singleCells)
        )}
      </div>

      {selected && (
        <aside className="roomio-nr-detail">
          <h3>Oda {selected.room.roomNo}</h3>
          <dl>
            <div><dt>Tip</dt><dd>{selected.room.typeName} ({selected.room.typeShort})</dd></div>
            <div><dt>Yatak</dt><dd>{selected.room.bedType}</dd></div>
            <div><dt>Kapasite</dt><dd>{selected.room.maxPersons} kişi</dd></div>
            <div><dt>Konum</dt><dd>{selected.room.location}</dd></div>
            <div><dt>Temizlik</dt><dd>{HK_STATUS_LABELS[selected.room.hkStatus]}</dd></div>
            <div><dt>Rack</dt><dd>{getRackDisplay(selected, displayCtx).label}</dd></div>
            {selected.guestName && <div><dt>Misafir</dt><dd>{selected.guestName}</dd></div>}
            {selected.room.specialInfo && <div><dt>Özel</dt><dd>{selected.room.specialInfo}</dd></div>}
            <div><dt>Fiyat</dt><dd>₺{selected.room.baseRate.toLocaleString('tr-TR')}</dd></div>
          </dl>
        </aside>
      )}

      {elektra ? <RackStatsFooter {...stats} /> : null}

      {!elektra ? (
      <div className="roomio-nr-footer">
        <div className="roomio-nr-footer-row">
          <span className="roomio-nr-footer-label">Oda tipi</span>
          <button type="button" className={`roomio-filter-chip${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>Tümü</button>
          {getRoomTypesList().map((t) => (
            <button
              key={t.code}
              type="button"
              className={`roomio-filter-chip${typeFilter === t.code ? ' active' : ''}`}
              onClick={() => setTypeFilter(t.code)}
            >
              {t.short}
            </button>
          ))}
        </div>
        <div className="roomio-nr-footer-row">
          <span className="roomio-nr-footer-label">Konum</span>
          <button type="button" className={`roomio-filter-chip${locationFilter === 'all' ? ' active' : ''}`} onClick={() => setLocationFilter('all')}>Tümü</button>
          <button type="button" className={`roomio-filter-chip${locationFilter === 'sol' ? ' active' : ''}`} onClick={() => setLocationFilter('sol')}>Sol koridor</button>
          <button type="button" className={`roomio-filter-chip${locationFilter === 'sag' ? ' active' : ''}`} onClick={() => setLocationFilter('sag')}>Sağ koridor</button>
          <button type="button" className={`roomio-filter-chip${occupiedOnly ? ' active' : ''}`} onClick={() => setOccupiedOnly((v) => !v)}>Dolu odalar</button>
          <span className="roomio-nr-status">Rack Hazır · {countTotalRooms()} oda · dolu {counts['dolu-temiz'] + counts['dolu-kirli'] + counts.checkout}</span>
        </div>
      </div>
      ) : null}
    </div>
  );
}

export function RoomRackPreview() {
  return <RoomRackGrid preview defaultFloor="all" />;
}
