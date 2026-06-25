'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { TOP_MENU_GROUPS, topMenuItems } from '@/lib/navigation/top-menu-nav';
import { navItemActive, type SidebarNavItem } from '@/lib/navigation/sidebar-nav';
import { translateSidebarNavItems } from '@/lib/i18n/kurulus-nav-i18n';
import { useI18n } from '@/components/i18n/I18nProvider';

const MAX_CASCADE_COLUMNS = 5;
const PANEL_EST_WIDTH = 480;

type PanelPos = { top: number; left: number; flip: boolean };

function buildColumns(root: SidebarNavItem[], path: string[]): SidebarNavItem[][] {
  const columns: SidebarNavItem[][] = [root];
  let level = root;
  for (const id of path) {
    const node = level.find((item) => item.id === id);
    if (!node?.children?.length) break;
    columns.push(node.children);
    level = node.children;
    if (columns.length >= MAX_CASCADE_COLUMNS) break;
  }
  return columns;
}

function CascadeRow({
  item,
  colIndex,
  path,
  pathname,
  onEnter,
}: {
  item: SidebarNavItem;
  colIndex: number;
  path: string[];
  pathname: string;
  onEnter: (item: SidebarNavItem, colIndex: number) => void;
}) {
  if (item.separator) {
    return <div className="roomio-top-menu__sep" role="separator" />;
  }

  const hasChildren = Boolean(item.children?.length);
  const selected = path[colIndex] === item.id;
  const active = navItemActive(pathname, item);

  if (hasChildren) {
    return (
      <div
        className={`roomio-top-menu__row roomio-top-menu__row--branch${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
        onMouseEnter={() => onEnter(item, colIndex)}
      >
        {item.href && item.href !== '#' ? (
          <Link href={item.href} className="roomio-top-menu__row-label">
            {item.label}
          </Link>
        ) : (
          <span className="roomio-top-menu__row-label">{item.label}</span>
        )}
        <ChevronRight size={14} aria-hidden className="roomio-top-menu__row-chevron" />
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? '#'}
      className={`roomio-top-menu__row roomio-top-menu__row--link${active ? ' is-active' : ''}`}
      onMouseEnter={() => onEnter(item, colIndex)}
    >
      <span className="roomio-top-menu__row-label">{item.label}</span>
    </Link>
  );
}

function TopMenuCascadePanel({
  items,
  pathname,
  onClose,
}: {
  items: SidebarNavItem[];
  pathname: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [path, setPath] = useState<string[]>([]);
  const translated = useMemo(() => translateSidebarNavItems(items, t), [items, t]);
  const columns = useMemo(() => buildColumns(translated, path), [translated, path]);

  const onEnter = (item: SidebarNavItem, colIndex: number) => {
    setPath((prev) => {
      const next = prev.slice(0, colIndex);
      if (item.children?.length) next.push(item.id);
      return next;
    });
  };

  return (
    <div
      className="roomio-top-menu__cascade"
      onMouseLeave={() => setPath([])}
      onClick={onClose}
    >
      {columns.map((colItems, colIndex) => (
        <div key={`col-${colIndex}-${path.slice(0, colIndex).join('/')}`} className="roomio-top-menu__col">
          {colItems.map((item) => (
            <CascadeRow
              key={item.id}
              item={item}
              colIndex={colIndex}
              path={path}
              pathname={pathname}
              onEnter={onEnter}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function panelPosition(anchor: HTMLElement): PanelPos {
  const rect = anchor.getBoundingClientRect();
  const flip = rect.left + PANEL_EST_WIDTH > window.innerWidth - 8;
  const left = flip ? Math.max(8, rect.right - PANEL_EST_WIDTH) : rect.left;
  return { top: rect.bottom, left, flip };
}

export function TopMenuNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);

  const openGroup = TOP_MENU_GROUPS.find((g) => g.id === openId);

  const updatePanelPos = useCallback(() => {
    if (!openId) return;
    const el = groupRefs.current[openId];
    if (!el) return;
    setPanelPos(panelPosition(el));
  }, [openId]);

  useLayoutEffect(() => {
    if (!openId) {
      setPanelPos(null);
      return;
    }
    updatePanelPos();
  }, [openId, updatePanelPos]);

  useEffect(() => {
    if (!openId) return;
    const onReflow = () => updatePanelPos();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [openId, updatePanelPos]);

  function groupActive(groupId: string) {
    return topMenuItems(groupId).some((item) => navItemActive(pathname, item));
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  }

  function openGroupMenu(groupId: string) {
    cancelClose();
    setOpenId(groupId);
  }

  const portalPanel =
    openGroup && panelPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`roomio-top-menu__panel roomio-top-menu__panel--portal${panelPos.flip ? ' is-flip-panel' : ''}`}
            style={{ top: panelPos.top, left: panelPos.left }}
            role="menu"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <TopMenuCascadePanel
              items={topMenuItems(openGroup.id)}
              pathname={pathname}
              onClose={() => setOpenId(null)}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="roomio-top-menu-scroll">
        <nav className="roomio-top-menu" aria-label="Ana menü">
          {TOP_MENU_GROUPS.map((group) => {
            const isOpen = openId === group.id;
            return (
              <div
                key={group.id}
                ref={(el) => {
                  groupRefs.current[group.id] = el;
                }}
                className={`roomio-top-menu__group${isOpen ? ' is-open' : ''}${groupActive(group.id) ? ' is-active' : ''}`}
                onMouseEnter={() => openGroupMenu(group.id)}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  className="roomio-top-menu__trigger"
                  aria-haspopup="menu"
                  aria-expanded={isOpen}
                >
                  {t(`menu.${group.id}`, undefined, group.label)}
                </button>
              </div>
            );
          })}
        </nav>
      </div>
      {portalPanel}
    </>
  );
}
