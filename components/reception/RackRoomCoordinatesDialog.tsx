'use client';

import { createPortal } from 'react-dom';
import { HK_STATUS_LABELS } from '@/lib/types/room';
import type { RackCell } from '@/lib/types/room';
import { getRackDisplay, type RackDisplayContext } from '@/lib/rooms/rack-display';

type Props = {
  cell: RackCell | null;
  ctx: RackDisplayContext;
  onClose: () => void;
};

export function RackRoomCoordinatesDialog({ cell, ctx, onClose }: Props) {
  if (!cell || typeof document === 'undefined') return null;

  const display = getRackDisplay(cell, ctx);
  const corridor = cell.room.suffix <= 9 ? 'Sol koridor' : 'Sağ koridor';

  return createPortal(
    <>
      <div className="roomio-rack-ctx-backdrop" onClick={onClose} aria-hidden />
      <div
        className="roomio-rack-coords-dialog"
        role="dialog"
        aria-labelledby="rack-coords-title"
        onContextMenu={(e) => e.preventDefault()}
      >
        <h3 id="rack-coords-title">Oda Koordinatlari — {cell.room.roomNo}</h3>
        <dl>
          <div><dt>Kat</dt><dd>{cell.room.floor}</dd></div>
          <div><dt>Koridor</dt><dd>{corridor} (suffix {cell.room.suffix})</dd></div>
          <div><dt>Tip</dt><dd>{cell.room.typeName} ({cell.room.typeShort})</dd></div>
          <div><dt>Konum</dt><dd>{cell.room.location}</dd></div>
          <div><dt>Bina</dt><dd>{cell.room.building}</dd></div>
          <div><dt>HK</dt><dd>{HK_STATUS_LABELS[cell.room.hkStatus]}</dd></div>
          <div><dt>Rack</dt><dd>{display.label}</dd></div>
          <div><dt>Misafir</dt><dd>{cell.guestName ?? '—'}</dd></div>
        </dl>
        <div className="roomio-rack-coords-dialog__actions">
          <button type="button" className="roomio-btn roomio-btn--secondary" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
