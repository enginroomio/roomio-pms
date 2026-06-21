'use client';

import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
};

/** Ana sayfayı mevcut içerik alanına kaydırmasız sığdırır — yatayda tam genişlik korunur. */
export function DashboardOneScreen({ children }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const root = rootRef.current;
    if (!shell || !root) return;

    const content = root.closest('.roomio-content') as HTMLElement | null;

    function fit() {
      const shellEl = shellRef.current;
      const rootEl = rootRef.current;
      if (!shellEl || !rootEl) return;

      rootEl.style.transform = 'none';
      rootEl.style.width = '100%';
      shellEl.style.height = 'auto';

      const available = content?.clientHeight ?? shellEl.clientHeight;
      const needed = rootEl.scrollHeight;
      if (!available || needed <= available) return;

      const scaleY = Math.max(0.78, available / needed);
      rootEl.style.transform = `scaleY(${scaleY})`;
      rootEl.style.transformOrigin = 'top left';
      shellEl.style.height = `${Math.floor(needed * scaleY)}px`;
      shellEl.style.overflow = 'hidden';
    }

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(shell);
    if (content) observer.observe(content);
    window.addEventListener('resize', fit);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  return (
    <div ref={shellRef} className="roomio-dashboard-fit">
      <div ref={rootRef} className="roomio-dashboard roomio-dashboard--one-screen">
        {children}
      </div>
    </div>
  );
}
