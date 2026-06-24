'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { useContextMenuPosition } from '@/lib/client/context-menu-position';
import { CONTEXT_MENU_GROUPS, contextMenuItems } from '@/lib/navigation/context-menu-nav';
import type { SidebarNavItem } from '@/lib/navigation/sidebar-nav';

export type MainContextMenuState = { x: number; y: number } | null;

type Props = {
  menu: MainContextMenuState;
  onClose: () => void;
};

function ContextMenuLeaf({
  item,
  onClose,
}: {
  item: SidebarNavItem;
  onClose: () => void;
}) {
  if (item.separator) {
    return <div className="roomio-ctx-sep" role="separator" />;
  }

  if (item.children?.length) {
    return (
      <div className="roomio-ctx-branch">
        <button type="button" className="roomio-ctx-item roomio-ctx-item--branch">
          <span>{item.label}</span>
          <ChevronRight size={14} aria-hidden />
        </button>
        <div className="roomio-ctx-flyout" role="menu">
          {item.children.map((child) => (
            <ContextMenuLeaf key={child.id} item={child} onClose={onClose} />
          ))}
        </div>
      </div>
    );
  }

  if (!item.href || item.href === '#') return null;

  return (
    <Link href={item.href} className="roomio-ctx-item" role="menuitem" onClick={onClose}>
      {item.label}
    </Link>
  );
}

export function ElektraMainContextMenu({ menu, onClose }: Props) {
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

  if (!menu || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="roomio-ctx-backdrop"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
        aria-hidden
      />
      <div
        ref={menuRef}
        className="roomio-ctx-menu"
        style={{ left: pos.x, top: pos.y }}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
        aria-label="Elektra ana menü"
      >
        <div className="roomio-ctx-title">Roomio PMS — Ana Menü</div>
        {CONTEXT_MENU_GROUPS.map((group) => {
          const items = contextMenuItems(group.id);
          if (!items.length) return null;
          return (
            <div key={group.id} className="roomio-ctx-branch roomio-ctx-branch--group">
              <button type="button" className="roomio-ctx-item roomio-ctx-item--group">
                <span>{group.label}</span>
                <ChevronRight size={14} aria-hidden />
              </button>
              <div className="roomio-ctx-flyout roomio-ctx-flyout--group" role="menu">
                {items.map((item) => (
                  <ContextMenuLeaf key={item.id} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
