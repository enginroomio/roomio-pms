'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useClientSearchParams } from '@/lib/client/use-client-search-params';

const LINKS = [
  { href: '/reservations/calendar', key: 'reservations.tab.calendar', match: 'calendar' as const },
  { href: '/reservations/calendar?mode=filter-wizard', key: 'reservations.tab.filterWizard', match: 'filter-wizard' as const },
  { href: '/reservations', key: 'reservations.tab.list', match: 'list' as const },
  { href: '/reservations/new', key: 'reservations.tab.new', match: 'new' as const },
  { href: '/reception/inhouse', key: 'reservations.tab.inhouse', match: 'external' as const },
  { href: '/reception/vacant', key: 'reservations.tab.vacant', match: 'external' as const },
  { href: '/rooms?tab=blocking', key: 'reservations.tab.blocking', match: 'external' as const },
  { href: '/reservations?tab=availability', key: 'reservations.tab.availability', match: 'availability' as const },
  { href: '/reservations?tab=egm', key: 'reservations.tab.egm', match: 'egm' as const },
  { href: '/reservations?tab=group', key: 'reservations.tab.group', match: 'group' as const },
] as const;

function isActive(pathname: string, tab: string | null, mode: string | null, match: (typeof LINKS)[number]['match']) {
  if (match === 'calendar') return pathname === '/reservations/calendar' && mode !== 'filter-wizard';
  if (match === 'filter-wizard') return pathname === '/reservations/calendar' && mode === 'filter-wizard';
  if (match === 'list') return pathname === '/reservations' && !tab;
  if (match === 'new') return pathname === '/reservations/new';
  if (match === 'availability') return pathname === '/reservations' && tab === 'availability';
  if (match === 'egm') return pathname === '/reservations' && tab === 'egm';
  if (match === 'group') return pathname === '/reservations' && tab === 'group';
  return false;
}

export function ReservationModuleTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const searchParams = useClientSearchParams();
  const tab = searchParams.get('tab');
  const mode = searchParams.get('mode');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMode = mounted ? mode : null;

  return (
    <nav className="roomio-rez-tabs" aria-label="Rezervasyon modülü">
      {LINKS.map((l) => {
        const active = l.match === 'external'
          ? pathname === l.href.split('?')[0]
          : isActive(pathname, tab, activeMode, l.match);
        return (
          <Link key={l.href} href={l.href} className={`roomio-rez-tab${active ? ' is-active' : ''}`}>
            {t(l.key)}
          </Link>
        );
      })}
    </nav>
  );
}
