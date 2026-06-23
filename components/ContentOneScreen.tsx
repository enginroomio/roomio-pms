'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

export type OneScreenVariant = 'default' | 'dashboard' | 'hk' | 'hk-scroll';

type Props = {
  children: React.ReactNode;
  variant?: OneScreenVariant;
};

const BODY_CLASS: Record<OneScreenVariant, string> = {
  default: 'roomio-one-screen-fit__body--page',
  dashboard: 'roomio-dashboard roomio-dashboard--one-screen',
  hk: 'roomio-hk-mobile roomio-hk-mobile--one-screen roomio-dashboard roomio-dashboard--one-screen',
  'hk-scroll':
    'roomio-hk-mobile roomio-hk-mobile--scroll roomio-hk-mobile--one-screen roomio-dashboard roomio-dashboard--one-screen',
};

const FIT_OPTIONS: Record<OneScreenVariant, { minScale?: number; uniformScale?: boolean; allowScroll?: boolean }> = {
  default: { minScale: 0.55, uniformScale: true },
  dashboard: { minScale: 0.55, uniformScale: true },
  hk: { minScale: 0.55, uniformScale: true },
  'hk-scroll': { allowScroll: true },
};

/** Sayfa içeriğini kaydırmasız tek ekrana orantılı sığdırır (tüm rotalar). */
export function ContentOneScreen({ children, variant = 'default' }: Props) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>(FIT_OPTIONS[variant]);

  return (
    <div ref={shellRef} className="roomio-one-screen-fit">
      <div ref={rootRef} className={`roomio-one-screen-fit__body ${BODY_CLASS[variant]}`}>
        {children}
      </div>
    </div>
  );
}
