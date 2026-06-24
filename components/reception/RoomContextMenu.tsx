'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenuPosition } from '@/lib/client/context-menu-position';
import type { RackCell } from '@/lib/types/room';
import type { Reservation } from '@/lib/types/reservation';

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
  | { type: 'folio' }
  | { type: 'setStatus'; status: 'CLEAN' | 'DIRTY' | 'OOO' | 'OOS' }
  | { type: 'rackInfo' };

type Props = {
  menu: RoomContextMenuState;
  busy?: boolean;
  onAction: (action: RoomMenuAction) => void;
  onClose: () => void;
};

export function RoomContextMenu({ menu, busy, onAction, onClose }: Props) {
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
  const canCheckIn = Boolean(arrival && !inHouse);
  const canCheckOut = Boolean(inHouse);

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
        className="roomio-rack-ctx-menu"
        style={{ left: pos.x, top: pos.y }}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
        aria-label={`Oda ${cell.room.roomNo} işlemleri`}
      >
        <div className="roomio-rack-ctx-title">
          Oda {cell.room.roomNo}
          <span>{cell.room.typeShort} · {cell.guestName ?? 'Boş'}</span>
        </div>

        {inHouse ? (
          <Link
            href={`/reception/guest/${inHouse.id}`}
            className="roomio-rack-ctx-item"
            role="menuitem"
            onClick={onClose}
          >
            CheckIn Bilgileri
          </Link>
        ) : (
          <button
            type="button"
            className="roomio-rack-ctx-item"
            role="menuitem"
            disabled={!arrival}
            onClick={() => run({ type: 'checkInInfo' })}
          >
            CheckIn Bilgileri
          </button>
        )}

        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={!canCheckIn || busy}
          onClick={() => run({ type: 'checkIn' })}
        >
          Check In Yap
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={!canCheckOut || busy}
          onClick={() => run({ type: 'checkOut' })}
        >
          Check Out Yap
        </button>

        <div className="roomio-rack-ctx-sep" />

        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={!inHouse || busy}
          onClick={() => run({ type: 'folio' })}
        >
          Folyo / Tahsilat
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
          Arızalı Olarak Göster
        </button>
        <button
          type="button"
          className="roomio-rack-ctx-item"
          role="menuitem"
          disabled={busy}
          onClick={() => run({ type: 'setStatus', status: 'OOS' })}
        >
          Kullanıma Kapalı Göster
        </button>

        <div className="roomio-rack-ctx-sep" />

        <Link href="/rooms" className="roomio-rack-ctx-item" role="menuitem" onClick={onClose}>
          Room Rack (F12)
        </Link>
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
