'use client';

import { useEffect, useState } from 'react';

/** Sağ tık HK menüsü — trackpad dahil masaüstü işaretçileri */
export function detectHkContextMenu(): boolean {
  if (typeof window === 'undefined') return true;

  const touchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
  if (touchOnly) return false;

  return (
    window.matchMedia('(hover: hover)').matches ||
    window.matchMedia('(pointer: fine)').matches ||
    window.matchMedia('(any-pointer: fine)').matches
  );
}

/** @deprecated use detectHkContextMenu — kept for imports */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const queries = ['(hover: hover)', '(pointer: fine)', '(any-pointer: fine)', '(pointer: coarse)'];
    const mqs = queries.map((q) => window.matchMedia(q));
    const update = () => setFine(detectHkContextMenu());
    update();
    mqs.forEach((mq) => mq.addEventListener('change', update));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', update));
  }, []);

  return fine;
}
