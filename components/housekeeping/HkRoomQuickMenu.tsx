'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

const ALL_STATUSES = ['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'] as const;

type Props = {
  roomNo: string;
  current: HousekeepingBoardRow['status'];
  x: number;
  y: number;
  saving: boolean;
  onSelect: (status: HousekeepingBoardRow['status']) => void;
  onClose: () => void;
};

export function HkRoomQuickMenu({ roomNo, current, x, y, saving, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pad = 8;
    const rect = el.getBoundingClientRect();
    let top = y;
    let left = x;
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    setPos({ top, left });
  }, [x, y]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="roomio-hk-quick-menu"
      style={{ top: pos.top, left: pos.left }}
      role="menu"
      aria-label={`Oda ${roomNo} durum menüsü`}
    >
      <div className="roomio-hk-quick-menu__title">Oda {roomNo}</div>
      <div className="roomio-hk-quick-menu__items">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            role="menuitem"
            className={`roomio-hk-quick-menu__item roomio-hk-mini-cell--${status.toLowerCase()}${current === status ? ' is-active' : ''}`}
            disabled={saving}
            onClick={() => onSelect(status)}
          >
            {HK_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
      <p className="roomio-hk-quick-menu__hint">Sol tık: hızlı döngü · Sağ tık: bu menü</p>
    </div>,
    document.body,
  );
}
