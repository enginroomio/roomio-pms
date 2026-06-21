'use client';

import type { ReservationStatus } from '@/lib/types/reservation';
import { STATUS_LABELS } from '@/lib/types/reservation';

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
  onChange: (patch: Partial<ReservationListFilterState>) => void;
  onApply: () => void;
  onClear: () => void;
};

export function ReservationListFilters({
  filters,
  agencies,
  onChange,
  onApply,
  onClear,
}: Props) {
  return (
    <div className="roomio-rez-filters">
      <div className="roomio-rez-filters__title">Filtreler</div>
      <div className="roomio-rez-filters__row">
        <label className="roomio-field">
          <span>Giriş Tarihi</span>
          <input
            className="roomio-input"
            type="date"
            value={filters.checkInFrom}
            onChange={(e) => onChange({ checkInFrom: e.target.value })}
          />
        </label>
        <label className="roomio-field">
          <span>Çıkış Tarihi</span>
          <input
            className="roomio-input"
            type="date"
            value={filters.checkOutTo}
            onChange={(e) => onChange({ checkOutTo: e.target.value })}
          />
        </label>
        <label className="roomio-field">
          <span>Durum</span>
          <select
            className="roomio-select"
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as ReservationStatus | 'ALL' })}
          >
            <option value="ALL">Tümü</option>
            {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="roomio-field">
          <span>Acenta</span>
          <select
            className="roomio-select"
            value={filters.agency}
            onChange={(e) => onChange({ agency: e.target.value })}
          >
            <option value="ALL">Tümü</option>
            {agencies.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="roomio-field roomio-field--row roomio-rez-filters__check">
          <input
            type="checkbox"
            checked={filters.includeCancelled}
            onChange={(e) => onChange({ includeCancelled: e.target.checked })}
          />
          <span>İptal Dahil</span>
        </label>
        <div className="roomio-rez-filters__actions">
          <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={onApply}>
            Listele
          </button>
          <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={onClear}>
            Temizle
          </button>
        </div>
      </div>
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
  guestName: string;
  refNo: string;
  roomNo?: string;
}>(
  rows: T[],
  filters: ReservationListFilterState,
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (!filters.includeCancelled && r.status === 'CANCELLED') return false;
    if (filters.status !== 'ALL' && r.status !== filters.status) return false;
    if (filters.agency !== 'ALL' && r.agency !== filters.agency) return false;
    if (filters.checkInFrom && r.checkIn < filters.checkInFrom) return false;
    if (filters.checkOutTo && r.checkOut > filters.checkOutTo) return false;
    if (!q) return true;
    return (
      r.guestName.toLowerCase().includes(q) ||
      r.refNo.toLowerCase().includes(q) ||
      r.agency.toLowerCase().includes(q) ||
      (r.roomNo?.includes(q) ?? false)
    );
  });
}
