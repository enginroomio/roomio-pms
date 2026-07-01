'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useContextMenuPosition } from '@/lib/client/context-menu-position';
import { shouldFlipFlyout } from '@/lib/client/flyout-flip';
import { translateSidebarNavItems } from '@/lib/i18n/kurulus-nav-i18n';
import { CONTEXT_MENU_GROUPS, contextMenuItems } from '@/lib/navigation/context-menu-nav';
import { contextMenuGroupsForPath } from '@/lib/navigation/context-menu-scope';
import type { SidebarNavItem } from '@/lib/navigation/sidebar-nav';

export type MainContextMenuState = { x: number; y: number } | null;

const CONTEXT_MENU_GROUP_KEYS: Record<string, string> = {
  sistem: 'sidebar.ctx.sistem',
  rezervasyon: 'sidebar.ctx.reservations',
  resepsiyon: 'sidebar.ctx.frontOffice',
  onkasa: 'sidebar.ctx.cashier',
  kat: 'sidebar.ctx.housekeeping',
  misafir: 'sidebar.ctx.guestRelations',
  banket: 'sidebar.ctx.banquet',
  arkaburo: 'sidebar.ctx.backOffice',
  gunsonu: 'sidebar.ctx.endOfDay',
  raporlar: 'sidebar.ctx.reports',
  ayarlar: 'sidebar.ctx.settings',
};

type Props = {
  menu: MainContextMenuState;
  pathname?: string;
  onClose: () => void;
};

function ContextMenuBranch({
  className,
  label,
  href,
  children,
  onClose,
}: {
  className?: string;
  label: React.ReactNode;
  href?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const branchRef = useRef<HTMLDivElement>(null);
  const [flip, setFlip] = useState(false);

  const onEnter = () => {
    if (branchRef.current) setFlip(shouldFlipFlyout(branchRef.current, 280));
  };

  return (
    <div
      ref={branchRef}
      className={`roomio-ctx-branch${flip ? ' is-flip-left' : ''}${className ? ` ${className}` : ''}`}
      onMouseEnter={onEnter}
    >
      {href && href !== '#' ? (
        <Link href={href} className="roomio-ctx-item roomio-ctx-item--branch" role="menuitem" onClick={onClose}>
          <span>{label}</span>
          <ChevronRight size={14} aria-hidden className={flip ? 'roomio-ctx-chevron--flip' : undefined} />
        </Link>
      ) : (
        <button type="button" className="roomio-ctx-item roomio-ctx-item--branch" tabIndex={-1}>
          <span>{label}</span>
          <ChevronRight size={14} aria-hidden className={flip ? 'roomio-ctx-chevron--flip' : undefined} />
        </button>
      )}
      <div className="roomio-ctx-flyout" role="menu" onClick={onClose}>
        {children}
      </div>
    </div>
  );
}

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
      <ContextMenuBranch label={item.label} href={item.href} onClose={onClose}>
        {item.children.map((child) => (
          <ContextMenuLeaf key={child.id} item={child} onClose={onClose} />
        ))}
      </ContextMenuBranch>
    );
  }

  if (!item.href || item.href === '#') return null;

  return (
    <Link href={item.href} className="roomio-ctx-item" role="menuitem" onClick={onClose}>
      {item.label}
    </Link>
  );
}

export function ElektraMainContextMenu({ menu, pathname = '', onClose }: Props) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const pos = useContextMenuPosition(menu, menuRef, 'topBar');

  const visibleGroupIds = useMemo(
    () => contextMenuGroupsForPath(pathname),
    [pathname],
  );

  const translatedGroups = useMemo(
    () =>
      CONTEXT_MENU_GROUPS.filter(
        (group) => !visibleGroupIds || visibleGroupIds.includes(group.id),
      ).map((group) => ({
        ...group,
        label: t(CONTEXT_MENU_GROUP_KEYS[group.id] ?? '', undefined, group.label),
        items: translateSidebarNavItems(contextMenuItems(group.id), t),
      })),
    [t, visibleGroupIds],
  );

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
        className="roomio-ctx-menu roomio-ctx-menu--from-top"
        style={{ left: pos.x, top: pos.y, maxHeight: pos.maxHeight }}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
        aria-label={t('sidebar.ctx.menuLabel')}
      >
        <div className="roomio-ctx-title">{t('sidebar.ctx.title')}</div>
        {translatedGroups.map((group) => {
          if (!group.items.length) return null;
          return (
            <ContextMenuBranch
              key={group.id}
              className="roomio-ctx-branch--group"
              label={group.label}
              onClose={onClose}
            >
              {group.items.map((item) => (
                <ContextMenuLeaf key={item.id} item={item} onClose={onClose} />
              ))}
            </ContextMenuBranch>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
