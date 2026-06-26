'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

export type OneScreenVariant = 'default' | 'dashboard' | 'hk' | 'theme' | 'list';

type Props = {
  children: React.ReactNode;
  variant?: OneScreenVariant;
};

const BODY_CLASS: Record<OneScreenVariant, string> = {
  default: 'roomio-one-screen-fit__body--page',
  dashboard: 'roomio-dashboard roomio-dashboard--one-screen',
  hk: 'roomio-hk-mobile roomio-hk-mobile--one-screen roomio-dashboard roomio-dashboard--one-screen',
  theme: 'roomio-one-screen-fit__body--page roomio-one-screen-fit__body--theme',
  list: 'roomio-one-screen-fit__body--page roomio-one-screen-fit__body--scroll',
};

const FIT_OPTIONS: Record<OneScreenVariant, { minScale?: number; uniformScale?: boolean; allowScroll?: boolean }> = {
  default: { minScale: 0.48, uniformScale: true },
  dashboard: { minScale: 0.48, uniformScale: true },
  hk: { minScale: 0.48, uniformScale: true },
  theme: { minScale: 0.72, uniformScale: true },
  list: { minScale: 1, uniformScale: false, allowScroll: true },
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
