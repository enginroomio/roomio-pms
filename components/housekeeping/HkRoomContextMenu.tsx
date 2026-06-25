'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

type HkQuickStatus = HousekeepingBoardRow['status'];

const HK_MENU_LABELS: Record<HkQuickStatus, string> = {
  CLEAN: 'Temiz',
  DIRTY: 'Kirli',
  INSPECT: 'Kontrol / Onay',
  OOO: 'Arızalı',
  DND: 'Rahatsız Etmeyin',
};

const HK_QUICK_STATUSES: HkQuickStatus[] = ['CLEAN', 'DIRTY', 'INSPECT', 'OOO', 'DND'];

export type HkRoomMenuState = {
  roomNo: string;
  x: number;
  y: number;
  currentStatus?: HkQuickStatus;
  openFaultId?: string;
} | null;

type Props = {
  menu: HkRoomMenuState;
  savingRoom?: string | null;
  onSelect: (roomNo: string, status: HkQuickStatus) => void;
  onCompleteFault?: (roomNo: string, faultId: string) => void;
  onClose: () => void;
};

export function HkRoomContextMenu({ menu, savingRoom, onSelect, onCompleteFault, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointer = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };

    window.addEventListener('keydown', onKey);
    const closeTimer = window.setTimeout(() => {
      window.addEventListener('mousedown', onPointer, true);
    }, 0);

    return () => {
      window.clearTimeout(closeTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer, true);
    };
  }, [menu, onClose]);

  if (!menu || typeof document === 'undefined') return null;

  const saving = savingRoom === menu.roomNo;
  const maxX = Math.max(8, window.innerWidth - 220);
  const maxY = Math.max(8, window.innerHeight - 320);
  const left = Math.min(menu.x, maxX);
  const top = Math.min(menu.y, maxY);

  return createPortal(
    <div
      ref={panelRef}
      className="roomio-hk-room-menu"
      style={{ left, top }}
      role="menu"
      aria-label={`Oda ${menu.roomNo} durum menüsü`}
    >
      <div className="roomio-hk-room-menu__head">
        <strong>Oda {menu.roomNo}</strong>
        <span>{saving ? 'Kaydediliyor…' : 'Durum seçin'}</span>
      </div>
      <ul className="roomio-hk-room-menu__list">
        {HK_QUICK_STATUSES.map((status) => {
          const active = menu.currentStatus === status;
          return (
            <li key={status}>
              <button
                type="button"
                role="menuitem"
                className={`roomio-hk-room-menu__item roomio-hk-room-menu__item--${status.toLowerCase()}${active ? ' is-current' : ''}`}
                disabled={saving}
                onClick={() => onSelect(menu.roomNo, status)}
              >
                <span>{HK_MENU_LABELS[status]}</span>
                {active ? <small>Mevcut</small> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {menu.openFaultId && onCompleteFault ? (
        <div className="roomio-hk-room-menu__footer">
          <button
            type="button"
            className="roomio-hk-room-menu__item roomio-hk-room-menu__item--complete"
            disabled={saving}
            onClick={() => onCompleteFault(menu.roomNo, menu.openFaultId!)}
          >
            Arıza tamamlandı
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
