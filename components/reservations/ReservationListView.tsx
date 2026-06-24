'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ELEKTRA_STATUS, formatDateElektra, formatGuestElektra, formatRoomElektra } from '@/lib/reservations/display';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { formatMoney } from '@/lib/data/reception';
import type { Reservation } from '@/lib/types/reservation';
import {
  DEFAULT_REZ_FILTERS,
  filterReservations,
  ReservationListFilters,
  type ReservationListFilterState,
} from './ReservationListFilters';
import { ReservationFnBar } from './ReservationFnBar';

const PAGE_SIZES = [25, 50, 100] as const;

type Props = {
  reservations: Reservation[];
};

export function ReservationListView({ reservations }: Props) {
  const [filters, setFilters] = useState<ReservationListFilterState>(DEFAULT_REZ_FILTERS);
  const [applied, setApplied] = useState<ReservationListFilterState>(DEFAULT_REZ_FILTERS);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const agencies = useMemo(
    () => [...new Set(reservations.map((r) => r.agency))].sort(),
    [reservations],
  );

  const filtered = useMemo(
    () => filterReservations(reservations, applied, query),
    [reservations, applied, query],
  );

  const folioIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const { balances, loading: folioLoading, error: folioError, reload: reloadFolio } = useFolioBalances(folioIds);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="roomio-rez-list">
      <ReservationListFilters
        filters={filters}
        agencies={agencies}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onApply={() => { setApplied(filters); setPage(1); }}
        onClear={() => {
          setFilters(DEFAULT_REZ_FILTERS);
          setApplied(DEFAULT_REZ_FILTERS);
          setQuery('');
          setPage(1);
        }}
      />

      <div className="roomio-rez-list__search" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="roomio-input"
          placeholder="Misafir, rez. no, acenta veya oda no…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          aria-label="Hızlı arama"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="roomio-btn roomio-btn--secondary roomio-btn--sm"
          disabled={folioLoading}
          onClick={() => void reloadFolio()}
        >
          {folioLoading ? 'Folyo…' : 'Folyo yenile'}
        </button>
      </div>

      {folioError ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert" style={{ marginBottom: 12 }}>
          Folyo bakiyeleri yüklenemedi: {folioError}
        </p>
      ) : null}

      <div className="roomio-card roomio-table-wrap roomio-rez-table-card">
        <table className="roomio-table roomio-rez-table">
          <thead>
            <tr>
              <th>Rez No</th>
              <th>Misafir</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Oda</th>
              <th>Folyo</th>
              <th>Durum</th>
              <th>Acente</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={9} className="roomio-table-empty">Kayıt bulunamadı.</td></tr>
            ) : (
              pageRows.map((r) => {
                const status = ELEKTRA_STATUS[r.status];
                const balance = balances[r.id];
                return (
                  <tr key={r.id}>
                    <td><strong>{r.refNo}</strong></td>
                    <td>{formatGuestElektra(r.guestName)}</td>
                    <td>{formatDateElektra(r.checkIn)}</td>
                    <td>{formatDateElektra(r.checkOut)}</td>
                    <td>{formatRoomElektra(r.roomNo, r.roomType)}</td>
                    <td className={balance != null && balance > 0 ? 'roomio-text-warn' : ''}>
                      {folioLoading && balance == null ? '…' : balance != null ? formatMoney(balance) : '—'}
                    </td>
                    <td>
                      <span className={`roomio-rez-status ${status.className}`}>{status.label}</span>
                    </td>
                    <td>{r.agency}</td>
                    <td><Link href={`/reservations/${r.id}`} className="roomio-link">Detay</Link></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="roomio-rez-table__foot">
          <span>Kayıt Sayısı: {filtered.length}</span>
          <div className="roomio-rez-table__pager">
            <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={currentPage <= 1} onClick={() => setPage(1)}>«</button>
            <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <span>{currentPage} / {totalPages}</span>
            <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>»</button>
            <select
              className="roomio-select roomio-select--compact"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              aria-label="Sayfa başına kayıt"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n} kayıt / sayfa</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ReservationFnBar />
    </div>
  );
}
