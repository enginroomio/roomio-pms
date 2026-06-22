'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

type Props = {
  children: React.ReactNode;
};

/** Ana sayfa — ViewportProvider tuval ölçeği + kompakt layout ile tek ekran. */
export function DashboardOneScreen({ children }: Props) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>({
    minScale: 0.78,
    uniformScale: true,
    skipWhenViewportFit: true,
  });

  return (
    <div ref={shellRef} className="roomio-dashboard-fit">
      <div ref={rootRef} className="roomio-dashboard roomio-dashboard--one-screen">
        {children}
      </div>
    </div>
  );
}
