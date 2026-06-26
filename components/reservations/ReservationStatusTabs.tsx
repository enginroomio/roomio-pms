'use client';

import {
  RESERVATION_LIST_TABS,
  type ReservationListTab,
} from '@/lib/reservations/list-tabs';

type Props = {
  active: ReservationListTab;
  counts: Record<ReservationListTab, number>;
  onChange: (tab: ReservationListTab) => void;
  compact?: boolean;
};

export function ReservationStatusTabs({ active, counts, onChange, compact }: Props) {
  return (
    <nav
      className={`roomio-rez-tabs roomio-rez-pro__tabs${compact ? ' roomio-rez-tabs--compact' : ''}`}
      role="tablist"
      aria-label="Rezervasyon durum sekmeleri"
    >
      {RESERVATION_LIST_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`roomio-rez-tab${active === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="roomio-rez-pro__tab-index">{tab.index}</span>
          {tab.label}
          {counts[tab.id] > 0 ? (
            <span className="roomio-rez-pro__tab-badge">{counts[tab.id]}</span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
