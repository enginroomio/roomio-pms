'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BedDouble, FileText, LayoutGrid, UserCog, Wrench } from 'lucide-react';

const NAV = [
  { href: '/housekeeping/mobile', label: 'Pano', icon: LayoutGrid },
  { href: '/housekeeping/rooms', label: 'Liste', icon: BedDouble },
  { href: '/housekeeping/assign', label: 'Atama', icon: UserCog },
  { href: '/housekeeping/faults', label: 'Arıza', icon: Wrench },
  { href: '/housekeeping/reports', label: 'Rapor', icon: FileText },
];

export function HkMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="roomio-hk-mobile__nav roomio-hk-mobile__nav--5" aria-label="HK mobil menü">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== '/housekeeping/mobile' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`roomio-hk-mobile__nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
