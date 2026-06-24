'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

/** Önizleme alanını kaydırmasız, orantılı küçülterek sığdırır */
export function ThemePreviewFit({ children }: { children: React.ReactNode }) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>({
    minScale: 0.28,
    uniformScale: true,
    local: true,
  });

  return (
    <div ref={shellRef} className="roomio-theme-preview-fit">
      <div ref={rootRef} className="roomio-theme-preview-fit__body">
        {children}
      </div>
    </div>
  );
}
