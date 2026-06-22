'use client';

import { useOneScreenFit } from '@/lib/client/use-one-screen-fit';

export type OneScreenVariant = 'default' | 'dashboard' | 'hk';

type Props = {
  children: React.ReactNode;
  variant?: OneScreenVariant;
};

const BODY_CLASS: Record<OneScreenVariant, string> = {
  default: 'roomio-one-screen-fit__body--page',
  dashboard: 'roomio-dashboard roomio-dashboard--one-screen',
  hk: 'roomio-hk-mobile roomio-hk-mobile--one-screen roomio-dashboard roomio-dashboard--one-screen',
};

/** Sayfa içeriğini kaydırmasız tek ekrana orantılı sığdırır (tüm rotalar). */
export function ContentOneScreen({ children, variant = 'default' }: Props) {
  const { shellRef, rootRef } = useOneScreenFit<HTMLDivElement, HTMLDivElement>({
    minScale: 0.55,
    uniformScale: true,
  });

  return (
    <div ref={shellRef} className="roomio-one-screen-fit">
      <div ref={rootRef} className={`roomio-one-screen-fit__body ${BODY_CLASS[variant]}`}>
        {children}
      </div>
    </div>
  );
}
