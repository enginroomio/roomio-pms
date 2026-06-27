'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { useContextMenuPosition } from '@/lib/client/context-menu-position';
import { shouldFlipFlyout } from '@/lib/client/flyout-flip';
import { RACK_FLOOR_COLORS } from '@/lib/client/rack-display-actions';
import type { RackPreferences } from '@/lib/client/rack-preferences';
import type { RackCell } from '@/lib/types/room';
import type { Reservation } from '@/lib/types/reservation';
import { resolveCheckInInfoHref } from '@/lib/client/room-rack-reservation';

export type RoomContextMenuState = {
  cell: RackCell;
  x: number;
  y: number;
  inHouse?: Reservation;
  arrival?: Reservation;
} | null;

export type RoomMenuAction =
  | { type: 'checkInInfo' }
  | { type: 'checkIn' }
  | { type: 'checkOut' }
  | { type: 'setStatus'; status: 'CLEAN' | 'DIRTY' | 'OOO' | 'OOS' }
  | { type: 'floorColor'; color?: string }
  | { type: 'changeView' }
  | { type: 'clearSort' }
  | { type: 'toggleDragDrop' }
  | { type: 'fixPositions' }
  | { type: 'roomCoordinates' }
  | { type: 'rackInfo' };

type Props = {
  menu: RoomContextMenuState;
  busy?: boolean;
  rackPrefs: Pick<RackPreferences, 'dragDrop' | 'fixPositions' | 'floorBg' | 'viewMode'>;
  onAction: (action: RoomMenuAction) => void;
  onClose: () => void;
};

function FloorColorBranch({
  current,
  onPick,
}: {
  current: string;
  onPick: (color: string) => void;
}) {
  const branchRef = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState(false);

  return (
    <div
      ref={branchRef}
      className={`roomio-rack-ctx-branch${flip ? ' is-flip-left' : ''}`}
      onMouseEnter={() => {
        if (branchRef.current) setFlip(shouldFlipFlyout(branchRef.current, 120));
      }}
    >
      <button type="button" className="roomio-rack-ctx-item roomio-rack-ctx-item--branch" tabIndex={-1}>
        <span>Zemin Rengini Seç</span>
        <ChevronRight size={12} aria-hidden />
      </button>
      <div className="roomio-rack-ctx-flyout" role="menu">
        {RACK_FLOOR_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`roomio-rack-ctx-item roomio-rack-ctx-item--swatch${current === color ? ' is-active' : ''}`}
            role="menuitem"
            onClick={() => onPick(color)}
          >
            <span className="roomio-rack-ctx-swatch" style={{ background: color }} aria-hidden />
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RoomContextMenu({ menu, busy, rackPrefs, onAction, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pos = useContextMenuPosition(menu, menuRef);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    const timer = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer, true);
      window.addEventListener('contextmenu', onPointer, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer, true);
      window.removeEventListener('contextmenu', onPointer, true);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const { cell, inHouse, arrival } = menu;
  const checkInInfoHref = resolveCheckInInfoHref(cell, inHouse, arrival);

  function run(action: RoomMenuAction) {
    if (busy) return;
    onAction(action);
  }

  return createPortal(
    <>
      <div
        className="roomio-rack-ctx-backdrop"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        ref={menuRef}
        className="roomio-rack-ctx-menu roomio-rack-ctx-menu--elektra"
        style={{ left: pos.x, top: pos.y }}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
        aria-label={`Oda ${cell.room.roomNo} işlemleri`}
      >
        <Link href={checkInInfoHref} className="roomio-rack-ctx-item" role="menuitem" onClick={onClose}>
          CheckIn Bilgileri
        </Link>

        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'checkIn' })}
        >
          Check In Yap
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'checkOut' })}
        >
          Check Out yap
        </button>

        <div className="roomio-rack-ctx-sep" />

        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'setStatus', status: 'CLEAN' })}
        >
          Temiz Olarak Göster
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'setStatus', status: 'DIRTY' })}
        >
          Kirli Olarak Göster
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'setStatus', status: 'OOO' })}
        >
          Arizalli Olarak Göster
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'setStatus', status: 'OOS' })}
        >
          Kullanima Kapali Göster
        </button>

        <div className="roomio-rack-ctx-sep" />

        <FloorColorBranch
          current={rackPrefs.floorBg}
          onPick={(color) => run({ type: 'floorColor', color })}
        />
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          onClick={() => run({ type: 'changeView' })}
        >
          Görünümü Degistir ({rackPrefs.viewMode === 'roomNo' ? 'oda no' : 'tip'})
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          onClick={() => run({ type: 'clearSort' })}
        >
          Siralamayi Kaldir
        </button>

        <div className="roomio-rack-ctx-sep" />

        <button
          type="button"
          className={`roomio-rack-ctx-item${rackPrefs.dragDrop ? ' is-checked' : ''}`}
          role="menuitemcheckbox"
          aria-checked={rackPrefs.dragDrop}
          onClick={() => run({ type: 'toggleDragDrop' })}
        >
          {rackPrefs.dragDrop ? 'Sürükle Bırak Pasif' : 'Sürükle Bırak Aktif'}
        </button>
        <button
          type="button"
          className={`roomio-rack-ctx-item${rackPrefs.fixPositions ? ' is-checked' : ''}`}
          role="menuitemcheckbox"
          aria-checked={rackPrefs.fixPositions}
          onClick={() => run({ type: 'fixPositions' })}
        >
          {rackPrefs.fixPositions ? 'Yerleri Serbest Bırak' : 'Yerleri Sabitle'}
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          onClick={() => run({ type: 'roomCoordinates' })}
        >
          Oda Koordinatlari
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          onClick={() => run({ type: 'rackInfo' })}
        >
          Rack Bilgi
        </button>
      </div>
    </>,
    document.body,
  );
}
