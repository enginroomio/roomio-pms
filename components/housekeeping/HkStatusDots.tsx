'use client';

import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

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
