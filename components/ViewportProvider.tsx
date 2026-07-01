'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  applyViewportToDocument,
  detectViewport,
  type ViewportMode,
  type ViewportState,
} from '@/lib/layout/viewport';

const ViewportContext = createContext<ViewportState | null>(null);

export function useViewport() {
  return useContext(ViewportContext);
}

function resolveViewportMode(_pathname: string): ViewportMode {
  return 'app';
}

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = resolveViewportMode(pathname);
  const [state, setState] = useState<ViewportState | null>(null);

  useEffect(() => {
    let frame = 0;

    function update() {
      const next = detectViewport(window.innerWidth, window.innerHeight, mode);
      if (pathname === '/') {
        next.fitScale = 1;
        next.fitActive = false;
        next.canvasWidth = '100%';
        next.canvasHeight = '100%';
      }
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
  }, [mode, pathname]);

  return <ViewportContext.Provider value={state}>{children}</ViewportContext.Provider>;
}
