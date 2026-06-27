'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BedDouble, FileText, LayoutGrid, UserCog, Wrench } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';

const NAV = [
  { href: '/housekeeping/mobile', key: 'hk.mobile.nav.board', icon: LayoutGrid },
  { href: '/housekeeping/rooms', key: 'hk.mobile.nav.list', icon: BedDouble },
  { href: '/housekeeping/assign', key: 'hk.mobile.nav.assign', icon: UserCog },
  { href: '/housekeeping/faults', key: 'hk.mobile.nav.faults', icon: Wrench },
  { href: '/housekeeping/reports', key: 'hk.mobile.nav.reports', icon: FileText },
] as const;

export function HkMobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="roomio-hk-mobile__nav roomio-hk-mobile__nav--5" aria-label="HK mobil menü">
      {NAV.map(({ href, key, icon: Icon }) => {
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
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
