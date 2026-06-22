'use client';

import { useEffect, useRef } from 'react';

type Options = {
  /** Minimum dikey ölçek — daha küçük değer daha fazla sıkıştırır */
  minScale?: number;
};

const REFIT_DELAYS_MS = [0, 80, 240, 600, 1200, 2000];

/**
 * İçeriği flex kabuğuna kaydırmasız sığdırır (yalnızca dikey scaleY).
 * Kullanılabilir yükseklik .roomio-content içinde kardeş öğeler düşülerek hesaplanır.
 */
export function useOneScreenFit<TShell extends HTMLElement, TRoot extends HTMLElement>(
  options: Options = {},
) {
  const shellRef = useRef<TShell>(null);
  const rootRef = useRef<TRoot>(null);
  const minScale = options.minScale ?? 0.48;

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

          // Önce doğal yüksekliği ölç — shell kısıtlanmadan scrollHeight gerçek içerik boyutunu verir
          rootEl2.style.transform = 'none';
          rootEl2.style.width = '100%';
          shellEl2.style.height = 'auto';
          shellEl2.style.maxHeight = 'none';
          shellEl2.style.overflow = 'visible';

          const needed = rootEl2.scrollHeight;

          shellEl2.style.overflow = 'hidden';
          shellEl2.style.maxHeight = `${available}px`;
          shellEl2.style.height = `${available}px`;

          if (needed <= available + 1) {
            return;
          }

          let scaleY = Math.max(minScale, available / needed);
          if (needed * scaleY > available + 1) {
            scaleY = available / needed;
          }
          rootEl2.style.transform = `scaleY(${scaleY})`;
          rootEl2.style.transformOrigin = 'top left';
          shellEl2.style.height = `${Math.floor(needed * scaleY)}px`;
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
  }, [minScale]);

  return { shellRef, rootRef };
}
