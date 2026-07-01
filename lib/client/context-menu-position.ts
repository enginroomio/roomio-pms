import { useLayoutEffect, useState, type RefObject } from 'react';

export type ContextMenuAnchorY = 'cursor' | 'topBar';

export type ContextMenuPosition = {
  x: number;
  y: number;
  maxHeight: number;
};

const PAD = 8;
const MIN_MENU_HEIGHT = 120;

function topBarBottom(): number {
  if (typeof document === 'undefined') return PAD;
  const bar =
    document.querySelector('.roomio-top-menu') ?? document.querySelector('.roomio-header--app');
  return bar ? bar.getBoundingClientRect().bottom : PAD;
}

function clampHorizontal(x: number, width: number): number {
  let next = x;
  if (next + width > window.innerWidth - PAD) {
    next = Math.max(PAD, window.innerWidth - width - PAD);
  }
  return Math.max(PAD, next);
}

function fitMenuInViewport(
  anchor: { x: number; y: number },
  el: HTMLElement,
  anchorY: ContextMenuAnchorY,
): ContextMenuPosition {
  const vh = window.innerHeight;
  let y = anchorY === 'topBar' ? topBarBottom() : anchor.y;
  let x = anchor.x;

  el.style.maxHeight = '';
  const width = el.offsetWidth;
  const naturalHeight = el.scrollHeight;
  x = clampHorizontal(x, width);

  if (anchorY === 'topBar') {
    const maxHeight = Math.max(MIN_MENU_HEIGHT, vh - y - PAD);
    return { x, y, maxHeight };
  }

  const spaceBelow = vh - y - PAD;
  const spaceAbove = y - PAD;
  const openUp = naturalHeight > spaceBelow && spaceAbove > spaceBelow;

  let maxHeight: number;
  if (openUp) {
    maxHeight = Math.max(MIN_MENU_HEIGHT, spaceAbove);
    y = Math.max(PAD, y - Math.min(naturalHeight, maxHeight));
  } else {
    maxHeight = Math.max(MIN_MENU_HEIGHT, spaceBelow);
  }

  const usedHeight = Math.min(naturalHeight, maxHeight);
  if (y + usedHeight > vh - PAD) {
    y = Math.max(PAD, vh - usedHeight - PAD);
    maxHeight = Math.max(MIN_MENU_HEIGHT, vh - y - PAD);
  }

  return { x, y, maxHeight };
}

/** Sağ tık menüsünü viewport içinde tutar; taşarsa maxHeight ile dikey kaydırma */
export function useContextMenuPosition(
  anchor: { x: number; y: number } | null,
  menuRef: RefObject<HTMLElement | null>,
  anchorY: ContextMenuAnchorY = 'cursor',
): ContextMenuPosition {
  const [pos, setPos] = useState<ContextMenuPosition>({ x: 0, y: 0, maxHeight: 480 });

  useLayoutEffect(() => {
    if (!anchor) return;
    const el = menuRef.current;
    if (!el) return;

    const fit = () => {
      setPos(fitMenuInViewport(anchor, el, anchorY));
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
    // `anchor` is deliberately destructured to x/y: callers often pass a
    // freshly-created `{ x, y }` literal on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor?.x, anchor?.y, anchorY, menuRef]);

  return pos;
}
