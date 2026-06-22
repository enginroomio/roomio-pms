'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

type Props = {
  children: React.ReactNode;
};

/** HK mobil panoyu tek ekrana sığdırır — tuval ölçeği aktifken iç ölçek kapalı. */
export function HkMobileOneScreen({ children }: Props) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>({
    minScale: 0.52,
    uniformScale: true,
    skipWhenViewportFit: true,
  });

  return (
    <div ref={shellRef} className="roomio-hk-mobile-fit">
      <div ref={rootRef} className="roomio-hk-mobile roomio-hk-mobile--one-screen">
        {children}
      </div>
    </div>
  );
}
