'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { applyViewportToDocument, detectViewport, type ViewportState } from '@/lib/layout/viewport';

const ViewportContext = createContext<ViewportState | null>(null);

export function useViewport() {
  return useContext(ViewportContext);
}

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ViewportState | null>(null);

  useEffect(() => {
    let frame = 0;

    function update() {
      const next = detectViewport(window.innerWidth, window.innerHeight);
      applyViewportToDocument(next);
      setState(next);
    }

    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    };
  }, []);

  return <ViewportContext.Provider value={state}>{children}</ViewportContext.Provider>;
}
