'use client';

import { useEffect, useRef } from 'react';

type Options = {
  /** Minimum ölçek — daha küçük değer daha fazla sıkıştırır */
  minScale?: number;
  /** true: orantılı scale (x+y), false: yalnızca dikey scaleY */
  uniformScale?: boolean;
};

const REFIT_DELAYS_MS = [0, 80, 240, 600, 1200, 2000];

/**
 * İçeriği flex kabuğuna kaydırmasız sığdırır (orantılı scale veya yalnızca scaleY).
 * Kullanılabilir yükseklik .roomio-content içinde kardeş öğeler düşülerek hesaplanır.
 */
export function useOneScreenFit<TShell extends HTMLElement, TRoot extends HTMLElement>(
  options: Options = {},
) {
  const shellRef = useRef<TShell>(null);
  const rootRef = useRef<TRoot>(null);
  const minScale = options.minScale ?? 0.48;
  const uniformScale = options.uniformScale ?? true;

  useEffect(() => {
    const shell = shellRef.current;
    const root = rootRef.current;
    if (!shell || !root) return;

    const content = root.closest('.roomio-content') as HTMLElement | null;
    const host = root.closest('.roomio-hk-mobile-shell') as HTMLElement | null;
    let frame = 0;
    const timers: number[] = [];

    function measureAvailable(shellEl: HTMLElement): number {
      if (content) {
        const siblings = Array.from(content.children).filter((node) => node !== shellEl);
        const siblingsH = siblings.reduce(
          (sum, node) => sum + (node as HTMLElement).offsetHeight,
          0,
        );
        const cs = getComputedStyle(content);
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const gap = parseFloat(cs.rowGap || cs.gap || '0');
        const gapTotal = siblings.length > 0 ? gap * siblings.length : 0;
        return Math.max(0, content.clientHeight - siblingsH - padY - gapTotal);
      }

      if (host) {
        const cs = getComputedStyle(host);
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        return Math.max(0, host.clientHeight - padY);
      }

      const parent = shellEl.parentElement;
      if (parent && parent.clientHeight > 0) {
        return parent.clientHeight;
      }

      return shellEl.clientHeight;
    }

    function measureNeeded(rootEl: HTMLElement, width: number): number {
      const prev = {
        position: rootEl.style.position,
        top: rootEl.style.top,
        left: rootEl.style.left,
        width: rootEl.style.width,
        transform: rootEl.style.transform,
        visibility: rootEl.style.visibility,
        zIndex: rootEl.style.zIndex,
      };

      rootEl.style.position = 'fixed';
      rootEl.style.top = '0';
      rootEl.style.left = '-10000px';
      rootEl.style.width = `${width}px`;
      rootEl.style.transform = 'none';
      rootEl.style.visibility = 'hidden';
      rootEl.style.zIndex = '-1';

      const needed = rootEl.scrollHeight;

      rootEl.style.position = prev.position;
      rootEl.style.top = prev.top;
      rootEl.style.left = prev.left;
      rootEl.style.width = prev.width;
      rootEl.style.transform = prev.transform;
      rootEl.style.visibility = prev.visibility;
      rootEl.style.zIndex = prev.zIndex;

      return needed;
    }

    function fit() {
      const shellEl = shellRef.current;
      const rootEl = rootRef.current;
      if (!shellEl || !rootEl) return;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const shellEl2 = shellRef.current;
          const rootEl2 = rootRef.current;
          if (!shellEl2 || !rootEl2) return;

          const available = Math.floor(measureAvailable(shellEl2));
          if (available <= 0) return;

          const width = shellEl2.offsetWidth || rootEl2.offsetWidth;
          const needed = measureNeeded(rootEl2, width);

          shellEl2.style.overflow = 'hidden';
          shellEl2.style.maxHeight = `${available}px`;
          shellEl2.style.height = `${available}px`;
          rootEl2.style.transform = 'none';
          rootEl2.style.width = '100%';

          if (needed <= available + 1) {
            shellEl2.style.height = `${needed}px`;
            return;
          }

          let scale = Math.max(minScale, available / needed);
          if (needed * scale > available + 1) {
            scale = available / needed;
          }
          if (uniformScale) {
            rootEl2.style.transform = `scale(${scale})`;
            rootEl2.style.transformOrigin = 'top center';
          } else {
            rootEl2.style.transform = `scaleY(${scale})`;
            rootEl2.style.transformOrigin = 'top left';
          }
          shellEl2.style.height = `${Math.floor(needed * scale)}px`;
        });
      });
    }

    fit();
    for (const delay of REFIT_DELAYS_MS) {
      timers.push(window.setTimeout(fit, delay));
    }

    const observer = new ResizeObserver(fit);
    observer.observe(shell);
    observer.observe(root);
    let siblingObserver: MutationObserver | null = null;
    if (content) {
      observer.observe(content);
      siblingObserver = new MutationObserver(fit);
      siblingObserver.observe(content, { childList: true, subtree: true, attributes: true, characterData: true });
    }
    if (host) observer.observe(host);

    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => undefined);

    return () => {
      cancelAnimationFrame(frame);
      for (const id of timers) window.clearTimeout(id);
      observer.disconnect();
      siblingObserver?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [minScale, uniformScale]);

  return { shellRef, rootRef };
}
