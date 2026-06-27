'use client';

import { RefreshCw } from 'lucide-react';
import { FloorTabs } from '@/components/kit';

type Props = {
  businessDate: string;
  floor: number | 'all';
  onFloorChange: (floor: number | 'all') => void;
  viewMode: 'roomNo' | 'type';
  onViewModeChange: (mode: 'roomNo' | 'type') => void;
  cleanOnly: boolean;
  onCleanOnlyChange: (value: boolean) => void;
  showMaintenance: boolean;
  onShowMaintenanceChange: (value: boolean) => void;
  onRefresh?: () => void;
};

export function RackElektraToolbar({
  businessDate,
  floor,
  onFloorChange,
  viewMode,
  onViewModeChange,
  cleanOnly,
  onCleanOnlyChange,
  showMaintenance,
  onShowMaintenanceChange,
  onRefresh,
}: Props) {
  return (
    <div className="roomio-rack-elektra-toolbar">
      <div className="roomio-rack-elektra-toolbar__title">
        <h2>Room Rack (F12)</h2>
        <span className="roomio-rack-elektra-toolbar__ref">screen-104</span>
      </div>
      <div className="roomio-rack-elektra-toolbar__filters">
        <label className="roomio-nr-field">
          <span>Tarih</span>
          <input className="roomio-input" type="date" value={businessDate} readOnly />
        </label>
        <label className="roomio-nr-field">
          <span>Görünüm</span>
          <select
            className="roomio-select"
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as 'roomNo' | 'type')}
          >
            <option value="roomNo">Oda Numarası</option>
            <option value="type">Oda Tipi</option>
          </select>
        </label>
        <label className="roomio-nr-check">
          <input type="checkbox" checked={cleanOnly} onChange={(e) => onCleanOnlyChange(e.target.checked)} />
          Sadece Temiz Odalar
        </label>
        <label className="roomio-nr-check">
          <input type="checkbox" checked={showMaintenance} onChange={(e) => onShowMaintenanceChange(e.target.checked)} />
          Bakım Odalarını Göster
        </label>
        {onRefresh ? (
          <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={onRefresh}>
            <RefreshCw size={14} aria-hidden />
            Yenile
          </button>
        ) : null}
      </div>
      <FloorTabs value={floor} onChange={onFloorChange} className="roomio-rack-elektra-toolbar__floors" />
    </div>
  );
}

type StatsProps = {
  total: number;
  occupied: number;
  vacant: number;
  maint: number;
  inspect: number;
};

export function RackStatsFooter({ total, occupied, vacant, maint, inspect }: StatsProps) {
  return (
    <div className="roomio-rack-stats">
      <span><strong>Toplam Oda:</strong> {total}</span>
      <span><strong>Dolu:</strong> {occupied}</span>
      <span><strong>Boş:</strong> {vacant}</span>
      <span><strong>Bakımda:</strong> {maint}</span>
      <span><strong>Kontrol:</strong> {inspect}</span>
    </div>
  );
}
