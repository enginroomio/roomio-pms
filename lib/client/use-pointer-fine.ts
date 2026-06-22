'use client';

import { useEffect, useState } from 'react';

/** Masaüstü fare — dokunmatik telefon değil */
export function usePointerFine() {
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setPointerFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return pointerFine;
}
