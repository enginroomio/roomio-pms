'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/reception', label: 'Özet', exact: true },
  { href: '/reception/inhouse', label: 'Konaklayanlar' },
  { href: '/reception/arrivals', label: 'Bugün Giriş' },
  { href: '/reception/departures', label: 'Bugün Çıkış' },
  { href: '/reception/vacant', label: 'Boş Odalar' },
  { href: '/reception/guest-requests', label: 'Misafir Talepleri' },
];

export function ReceptionTabs() {
  const pathname = usePathname();
  return (
    <nav className="roomio-tabs" aria-label="Resepsiyon alt menü">
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
