'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/housekeeping', label: 'Özet', exact: true },
  { href: '/housekeeping/operations', label: 'Operasyon' },
  { href: '/housekeeping/rooms', label: 'Oda Durumu' },
  { href: '/housekeeping/tasks', label: 'Görevler' },
];

export function HousekeepingTabs() {
  const pathname = usePathname();
  return (
    <nav className="roomio-tabs" aria-label="Kat hizmetleri alt menü">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`roomio-tab${active ? ' active' : ''}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
