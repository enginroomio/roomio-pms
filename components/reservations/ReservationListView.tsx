'use client';

import Link from 'next/link';
import { LayoutTemplate, Wand2 } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { roomioFetch } from '@/lib/client/api';
import { useReservationListLayout } from '@/lib/client/use-reservation-list-layout';
import type { RoomBlock } from '@/lib/data/room-blocks';
import {
  buildAgencyCodeLookup,
} from '@/lib/reservations/agency-code';
import {
  getColumnWidth,
  resizeRezListColumn,
  tableWidthFromColumns,
  type RezListColumnId,
} from '@/lib/reservations/list-columns';
import {
  blockMatchesListFilters,
  buildReservationListRows,
  countByListTab,
  filterByListTab,
  type ReservationListRow,
  type ReservationListTab,
} from '@/lib/reservations/list-tabs';
import type { Reservation } from '@/lib/types/reservation';
import { ReservationListDesignWizard } from './ReservationListDesignWizard';
import { renderReservationListColumn, type RoomTypeLookup } from './ReservationListColumnCells';
import {
  DEFAULT_REZ_FILTERS,
  filterReservations,
  ReservationListFilters,
  type ReservationListFilterState,
} from './ReservationListFilters';
import { ReservationListToolbar } from './ReservationListToolbar';
import { ReservationListTableHeader } from './ReservationListTableHeader';
import { ReservationListWizardModal } from './ReservationListWizardModal';
import { ReservationStatusTabs } from './ReservationStatusTabs';

type Props = {
  reservations: Reservation[];
  onRefresh?: () => void;
  initialListTab?: ReservationListTab;
  trackMode?: boolean;
};

export function ReservationListView({ reservations, onRefresh, initialListTab, trackMode }: Props) {
  const router = useRouter();
  const {
    layout,
    archive,
    defaultTemplateId,
    ready,
    applyPreset,
    applyTemplate,
    saveAsTemplate,
    removeTemplate,
    pinDefaultTemplate,
    patchLayout,
    moveColumn,
    reorderColumn,
    resizeColumn,
    resetColumnWidths,
  } = useReservationListLayout();

  const [widthPreview, setWidthPreview] = useState<Record<RezListColumnId, number> | null>(null);

  const [filters, setFilters] = useState<ReservationListFilterState>(DEFAULT_REZ_FILTERS);
  const [applied, setApplied] = useState<ReservationListFilterState>(DEFAULT_REZ_FILTERS);
  const [query, setQuery] = useState('');
  const [listTab, setListTab] = useState<ReservationListTab>(initialListTab ?? 'reservation');

  useEffect(() => {
    if (initialListTab) setListTab(initialListTab);
  }, [initialListTab]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [agencyContracts, setAgencyContracts] = useState<{ code: string; name: string }[]>([]);
  const [roomTypeLookup, setRoomTypeLookup] = useState<RoomTypeLookup>(new Map());

  useEffect(() => {
    if (!ready) return;
    setFiltersOpen(layout.filtersDefaultOpen);
  }, [ready, layout.presetId, layout.filtersDefaultOpen]);

  useEffect(() => {
    void roomioFetch('/api/room-blocks')
      .then((res) => res.json())
      .then((json: { blocks?: RoomBlock[] }) => {
        if (json.blocks?.length) setRoomBlocks(json.blocks);
      })
      .catch(() => {});

    void roomioFetch('/api/agencies')
      .then((res) => res.json())
      .then((json: { agencies?: { code: string; name: string }[] }) => {
        if (json.agencies?.length) setAgencyContracts(json.agencies);
      })
      .catch(() => {});

    void roomioFetch('/api/room-type-defs')
      .then((res) => res.json())
      .then((json: { types?: { code: string; short: string; name: string; active?: boolean }[] }) => {
        if (!json.types?.length) return;
        const map: RoomTypeLookup = new Map();
        for (const t of json.types) {
          if (t.active === false) continue;
          map.set(t.code, { short: t.short, name: t.name });
        }
        setRoomTypeLookup(map);
      })
      .catch(() => {});
  }, []);

  const agencyLookup = useMemo(() => buildAgencyCodeLookup(agencyContracts), [agencyContracts]);
  const columnCtx = useMemo(
    () => ({ agencyLookup, agencyContracts, roomTypeLookup, router }),
    [agencyLookup, agencyContracts, roomTypeLookup, router],
  );

  const agencies = useMemo(
    () => [...new Set(reservations.map((r) => r.agency))].sort(),
    [reservations],
  );

  const tabCounts = useMemo(() => countByListTab(reservations), [reservations]);

  const filteredReservations = useMemo(() => {
    const base = filterReservations(reservations, applied, query, agencyLookup);
    return filterByListTab(base, listTab);
  }, [reservations, applied, query, listTab, agencyLookup]);

  const listRows = useMemo(() => {
    const roomNosInView = new Set(
      filteredReservations.map((r) => r.roomNo).filter((roomNo): roomNo is string => Boolean(roomNo)),
    );
    const visibleBlocks = roomBlocks.filter((block) =>
      blockMatchesListFilters(block, query, roomNosInView, listTab),
    );
    return buildReservationListRows(filteredReservations, visibleBlocks);
  }, [filteredReservations, roomBlocks, query, listTab]);

  const visibleCount = filteredReservations.length;
  const totalActive = tabCounts.all;
  const activeWidths = widthPreview ?? layout.columnWidths;
  const tableMinWidth = tableWidthFromColumns(layout.columnOrder, activeWidths);
  const colCount = layout.columnOrder.length;
  const isDense = layout.density === 'dense';

  function rowKey(row: ReservationListRow): string {
    return row.kind === 'block' ? `block-${row.block.id}` : row.reservation.id;
  }

  function onRowClick(row: ReservationListRow) {
    if (row.kind === 'block') {
      setSelectedId(null);
      return;
    }
    setSelectedId(row.reservation.id);
  }

  function openReservationRecord(row: ReservationListRow) {
    if (row.kind === 'block') {
      router.push(`/rooms?tab=blocking&focus=${row.block.roomNo}`);
      return;
    }
    router.push(`/reservations/${row.reservation.id}/edit`);
  }

  function onRowDoubleClick(e: MouseEvent, row: ReservationListRow) {
    e.preventDefault();
    e.stopPropagation();
    openReservationRecord(row);
  }

  function applyFilters(patch?: Partial<ReservationListFilterState>) {
    setFilters((prev) => {
      const next = { ...prev, ...(patch ?? {}) };
      setApplied(next);
      return next;
    });
  }

  function clearFilters() {
    setFilters(DEFAULT_REZ_FILTERS);
    setApplied(DEFAULT_REZ_FILTERS);
    setQuery('');
  }

  return (
    <div
      className={`roomio-rez-list roomio-rez-pro roomio-rez-pro--fill${isDense ? ' roomio-rez-pro--dense' : ' roomio-rez-pro--comfortable'}`}
    >
      <div className="roomio-rez-pro__chrome roomio-rez-pro__chrome--above">
        {trackMode ? (
          <p className="roomio-card roomio-page-desc roomio-rez-track-banner" role="status">
            Rezervasyon durum takip listesi — tüm aktif kayıtlar (iptal hariç). Durum sekmeleri ile filtreleyin.
          </p>
        ) : null}
        <div className="roomio-rez-pro__command-bar">
          <ReservationListToolbar selectedId={selectedId} onRefresh={onRefresh} />
          <input
            className="roomio-input roomio-rez-pro__search-inline"
            placeholder="Misafir, rez. no, acenta veya oda no…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Hızlı arama"
          />
          <button
            type="button"
            className={`roomio-btn roomio-btn--secondary roomio-btn--sm roomio-rez-pro__filter-btn${filtersOpen ? ' is-active' : ''}`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filtreler
          </button>
          <button
            type="button"
            className="roomio-btn roomio-btn--secondary roomio-btn--sm roomio-rez-pro__design-btn"
            onClick={() => setWizardOpen(true)}
            title="Yeni rezervasyon sihirbazı"
          >
            <Wand2 size={14} aria-hidden />
            Sihirbaz
          </button>
          <button
            type="button"
            className="roomio-btn roomio-btn--secondary roomio-btn--sm roomio-rez-pro__design-btn"
            onClick={() => setDesignOpen(true)}
            title="Liste dizayn sihirbazı"
          >
            <LayoutTemplate size={14} aria-hidden />
            Dizayn
          </button>
        </div>

        {filtersOpen ? (
          <ReservationListFilters
            compact
            filters={filters}
            agencies={agencies}
            agencyContracts={agencyContracts}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            onApply={(patch) => applyFilters(patch)}
            onClear={clearFilters}
          />
        ) : null}

        <ReservationStatusTabs active={listTab} counts={tabCounts} onChange={setListTab} compact />
      </div>

      <div className="roomio-card roomio-rez-table-card">
        <div className="roomio-rez-table-scroll roomio-table-wrap" tabIndex={0} role="region" aria-label="Rezervasyon listesi">
          <table
            className="roomio-table roomio-rez-table roomio-rez-pro__grid roomio-rez-pro__grid--fixed"
            style={{ minWidth: tableMinWidth, width: tableMinWidth }}
          >
            <colgroup>
              {layout.columnOrder.map((columnId) => {
                const w = getColumnWidth(activeWidths, columnId);
                return <col key={columnId} style={{ width: w, minWidth: w }} />;
              })}
            </colgroup>
            <ReservationListTableHeader
              columnOrder={layout.columnOrder}
              columnWidths={activeWidths}
              onReorder={reorderColumn}
              onResizePreview={(columnId, width) => {
                setWidthPreview(resizeRezListColumn(activeWidths, columnId, width));
              }}
              onResizeEnd={(columnId, width) => {
                resizeColumn(columnId, width);
                setWidthPreview(null);
              }}
              onResizeCancel={() => setWidthPreview(null)}
            />
            <tbody>
              {listRows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="roomio-table-empty">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                listRows.map((row) => {
                  const isBlock = row.kind === 'block';
                  const isSelected = !isBlock && selectedId === row.reservation.id;

                  return (
                    <tr
                      key={rowKey(row)}
                      className={
                        isBlock
                          ? 'roomio-rez-pro__row roomio-rez-pro__row--block'
                          : isSelected
                            ? 'roomio-rez-pro__row is-selected'
                            : 'roomio-rez-pro__row'
                      }
                      onClick={() => onRowClick(row)}
                      onDoubleClickCapture={(e) => onRowDoubleClick(e, row)}
                    >
                      {layout.columnOrder.map((columnId) => (
                        <Fragment key={`${rowKey(row)}-${columnId}`}>
                          {renderReservationListColumn(columnId, row, columnCtx)}
                        </Fragment>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="roomio-rez-table__foot roomio-rez-table__foot--compact">
          <span>
            Toplam: <strong>{visibleCount}</strong> ({totalActive}) kayıt
          </span>
          <span>Kayıt Sayısı: {visibleCount}</span>
          {selectedId ? (
            <span>
              Seçili:{' '}
              <Link href={`/reservations/${selectedId}`} className="roomio-link">
                {reservations.find((r) => r.id === selectedId)?.refNo}
              </Link>
            </span>
          ) : (
            <span className="roomio-rez-pro__hint">Satır seç · çift tık kayıt aç</span>
          )}
        </div>
      </div>

      <ReservationListDesignWizard
        open={designOpen}
        layout={layout}
        archive={archive}
        defaultTemplateId={defaultTemplateId}
        onClose={() => setDesignOpen(false)}
        onApplyPreset={applyPreset}
        onApplyTemplate={applyTemplate}
        onPatch={patchLayout}
        onMoveColumn={moveColumn}
        onResizeColumn={resizeColumn}
        onResetColumnWidths={resetColumnWidths}
        onSaveTemplate={(name, description) => saveAsTemplate(name, description)}
        onDeleteTemplate={removeTemplate}
        onPinDefault={pinDefaultTemplate}
        onOpenReservationWizard={() => setWizardOpen(true)}
      />

      <ReservationListWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => onRefresh?.()}
      />
    </div>
  );
}
