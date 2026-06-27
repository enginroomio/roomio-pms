'use client';

import { HkMobileNav } from '@/components/housekeeping/HkMobileNav';

type Props = {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function HkMobileFrame({ title, eyebrow = 'Kat Hizmetleri', actions, children }: Props) {
  return (
    <>
      <header className="roomio-hk-mobile__header roomio-hk-mobile__header--compact">
        <div>
          <p className="roomio-hk-mobile__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        {actions}
      </header>
      <div className="roomio-hk-mobile-page">{children}</div>
      <HkMobileNav />
    </>
  );
}
