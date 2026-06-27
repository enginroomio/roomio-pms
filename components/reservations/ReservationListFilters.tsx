'use client';

import type { ReservationStatus } from '@/lib/types/reservation';
import { STATUS_LABELS } from '@/lib/types/reservation';
import {
  resolveAgencyCode,
  type AgencyContractRef,
} from '@/lib/reservations/agency-code';

export type ReservationListFilterState = {
  checkInFrom: string;
  checkOutTo: string;
  status: ReservationStatus | 'ALL';
  agency: string;
  includeCancelled: boolean;
};

type Props = {
  filters: ReservationListFilterState;
  agencies: string[];
  agencyContracts?: AgencyContractRef[];
  compact?: boolean;
  showDate?: boolean;
  showRoom?: boolean;
  showCrm?: boolean;
  showSpecial?: boolean;
  onChange: (patch: Partial<ReservationListFilterState>) => void;
  onApply: (patch?: Partial<ReservationListFilterState>) => void;
  onClear: () => void;
};

export function ReservationListFilters({
  filters,
  agencies,
  agencyContracts = [],
  compact = false,
  showDate = true,
  showRoom = true,
  showCrm = true,
  showSpecial = false,
  onChange,
  onApply,
  onClear,
}: Props) {
  const chipAgencies = agencyContracts.length
    ? agencyContracts.map((a) => ({ code: a.code, name: a.name }))
    : agencies.map((name) => ({ code: resolveAgencyCode({ agency: name, market: '' }), name }));

  function selectAgency(code: string) {
    const next = code === 'ALL' ? 'ALL' : (filters.agency === code ? 'ALL' : code);
    onChange({ agency: next });
    onApply({ agency: next });
  }

  return (
    <div className={`roomio-rez-filters${compact ? ' roomio-rez-filters--elektra' : ''}`}>
      <div className="roomio-rez-filters__title">Filtreler</div>
      <div className="roomio-rez-filters__row">
        {showDate ? (
          <>
            <label className="roomio-field roomio-field--compact">
              <span>Giriş</span>
              <input
                className="roomio-input roomio-input--compact"
                type="date"
                value={filters.checkInFrom}
                onChange={(e) => onChange({ checkInFrom: e.target.value })}
              />
            </label>
            <label className="roomio-field roomio-field--compact">
              <span>Çıkış</span>
              <input
                className="roomio-input roomio-input--compact"
                type="date"
                value={filters.checkOutTo}
                onChange={(e) => onChange({ checkOutTo: e.target.value })}
              />
            </label>
          </>
        ) : null}

        {showRoom ? (
          <label className="roomio-field roomio-field--compact">
            <span>Durum</span>
            <select
              className="roomio-select roomio-select--compact"
              value={filters.status}
              onChange={(e) => onChange({ status: e.target.value as ReservationStatus | 'ALL' })}
            >
              <option value="ALL">Tümü</option>
              {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
        ) : null}

        {showCrm ? (
          <label className="roomio-field roomio-field--compact">
            <span>Acenta</span>
            <select
              className="roomio-select roomio-select--compact"
              value={filters.agency}
              onChange={(e) => onChange({ agency: e.target.value })}
            >
              <option value="ALL">Tümü</option>
              {chipAgencies.map((a) => (
                <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
              ))}
            </select>
          </label>
        ) : null}

        {showSpecial ? (
          <label className="roomio-field roomio-field--row roomio-rez-filters__check">
            <input
              type="checkbox"
              checked={filters.includeCancelled}
              onChange={(e) => onChange({ includeCancelled: e.target.checked })}
            />
            <span>İptal Dahil</span>
          </label>
        ) : null}

        <div className="roomio-rez-filters__actions">
          <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={() => onApply()}>
            Listele
          </button>
          <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={onClear}>
            Temizle
          </button>
        </div>
      </div>

      {showCrm && chipAgencies.length > 0 ? (
        <div className="roomio-rez-agency-chips" role="group" aria-label="Acenta hızlı filtre">
          <button
            type="button"
            className={`roomio-rez-agency-chip${filters.agency === 'ALL' ? ' is-active' : ''}`}
            onClick={() => selectAgency('ALL')}
          >
            Tümü
          </button>
          {chipAgencies.map((a) => (
            <button
              key={a.code}
              type="button"
              className={`roomio-rez-agency-chip${filters.agency === a.code ? ' is-active' : ''}`}
              title={a.name}
              onClick={() => selectAgency(a.code)}
            >
              {a.code}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const DEFAULT_REZ_FILTERS: ReservationListFilterState = {
  checkInFrom: '',
  checkOutTo: '',
  status: 'ALL',
  agency: 'ALL',
  includeCancelled: false,
};

export function filterReservations<T extends {
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  agency: string;
  market: string;
  guestName: string;
  refNo: string;
  roomNo?: string;
  extraData?: Record<string, string>;
}>(
  rows: T[],
  filters: ReservationListFilterState,
  query: string,
  agencyLookup?: Map<string, string>,
): T[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (!filters.includeCancelled && r.status === 'CANCELLED') return false;
    if (filters.status !== 'ALL' && r.status !== filters.status) return false;
    if (filters.agency !== 'ALL') {
      const code = resolveAgencyCode(r, agencyLookup);
      if (code !== filters.agency && r.agency !== filters.agency) return false;
    }
    if (filters.checkInFrom && r.checkIn < filters.checkInFrom) return false;
    if (filters.checkOutTo && r.checkOut > filters.checkOutTo) return false;
    if (!q) return true;
    const agencyCode = resolveAgencyCode(r, agencyLookup).toLowerCase();
    const roomNo = r.roomNo?.trim() ?? '';
    return (
      r.guestName.toLowerCase().includes(q) ||
      r.refNo.toLowerCase().includes(q) ||
      r.agency.toLowerCase().includes(q) ||
      agencyCode.includes(q) ||
      roomNo.includes(q)
    );
  });
}
