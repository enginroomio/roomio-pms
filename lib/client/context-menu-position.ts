import { useLayoutEffect, useState, type RefObject } from 'react';

export type ContextMenuAnchorY = 'cursor' | 'topBar';

function topBarBottom(): number {
  if (typeof document === 'undefined') return 8;
  const bar =
    document.querySelector('.roomio-top-menu') ?? document.querySelector('.roomio-header--app');
  return bar ? bar.getBoundingClientRect().bottom : 8;
}

/** Sağ tık menüsünü viewport içinde tutar; topBar = üst menü çubuğunun altından açılır */
export function useContextMenuPosition(
  anchor: { x: number; y: number } | null,
  menuRef: RefObject<HTMLElement | null>,
  anchorY: ContextMenuAnchorY = 'cursor',
) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!anchor) return;
    const el = menuRef.current;
    const pad = 8;
    let x = anchor.x;
    let y = anchorY === 'topBar' ? topBarBottom() : anchor.y;

    if (el) {
      const rect = el.getBoundingClientRect();
      if (x + rect.width > window.innerWidth - pad) {
        x = Math.max(pad, window.innerWidth - rect.width - pad);
      }
      if (y + rect.height > window.innerHeight - pad) {
        y = Math.max(pad, window.innerHeight - rect.height - pad);
      }
    }

    if (x < pad) x = pad;
    if (y < pad) y = pad;
    setPos({ x, y });
  }, [anchor?.x, anchor?.y, anchorY, menuRef]);

  return pos;
}
