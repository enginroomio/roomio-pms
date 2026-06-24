'use client';

import { getActiveFloors } from '@/lib/rooms/room-config';

type Floor = number | 'all';

type Props = {
  value: Floor;
  onChange: (floor: Floor) => void;
  allLabel?: string;
  className?: string;
};

export function FloorTabs({
  value,
  onChange,
  allLabel = 'Tüm rack (F12)',
  className = '',
}: Props) {
  return (
    <nav className={`roomio-rack-floor-shortcuts${className ? ` ${className}` : ''}`} aria-label="Kat kısayolları">
      <button
        type="button"
        className={`roomio-rack-floor-shortcut roomio-rack-floor-shortcut--all${value === 'all' ? ' is-active' : ''}`}
        onClick={() => onChange('all')}
      >
        {allLabel}
      </button>
      {getActiveFloors().map(({ floor: f }) => (
        <button
          key={f}
          type="button"
          className={`roomio-rack-floor-shortcut${value === f ? ' is-active' : ''}`}
          onClick={() => onChange(f)}
        >
          {f}. Kat
        </button>
      ))}
    </nav>
  );
}
