'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

type Props = {
  children: React.ReactNode;
};

/** Ana sayfayı mevcut içerik alanına kaydırmasız sığdırır — yatayda tam genişlik korunur. */
export function DashboardOneScreen({ children }: Props) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>({ minScale: 0.78 });

  return (
    <div ref={shellRef} className="roomio-dashboard-fit">
      <div ref={rootRef} className="roomio-dashboard roomio-dashboard--one-screen">
        {children}
      </div>
    </div>
  );
}
