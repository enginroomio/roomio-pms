'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

export function GuestRelationsTabs() {
  const pathname = usePathname();
  return (
    <nav className="roomio-tabs roomio-tabs--wrap" aria-label="Misafir ilişkileri alt menü">
      <Link href="/guest-relations" className={`roomio-tab${pathname === '/guest-relations' ? ' active' : ''}`}>Özet</Link>
      {GUEST_RELATIONS_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.id} href={item.href} className={`roomio-tab${active ? ' active' : ''}`} title={item.shortcut}>
            {item.label}{item.shortcut ? ` (${item.shortcut})` : ''}
          </Link>
        );
      })}
    </nav>
  );
}
