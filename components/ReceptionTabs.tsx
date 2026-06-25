'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';

const LINKS = [
  { href: '/reception', key: 'reception.tab.summary', exact: true },
  { href: '/reception/inhouse', key: 'reception.tab.inhouse' },
  { href: '/reception/arrivals', key: 'reception.tab.arrivals' },
  { href: '/reception/departures', key: 'reception.tab.departures' },
  { href: '/reception/vacant', key: 'reception.tab.vacant' },
  { href: '/reception/queue', key: 'reception.tab.queue' },
  { href: '/reception/guest-profile', key: 'reception.tab.guestProfile' },
  { href: '/reception/guest-requests', key: 'reception.tab.guestRequests' },
] as const;

export function ReceptionTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="roomio-tabs" aria-label="Resepsiyon alt menü">
      {LINKS.map((l) => {
        const active = 'exact' in l && l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`roomio-tab${active ? ' active' : ''}`}>
            {t(l.key)}
          </Link>
        );
      })}
    </nav>
  );
}
