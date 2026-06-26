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
  { href: '/reservations?tab=group-codes', key: 'reservations.tab.groupCodes', match: 'group-codes' as const },
  { href: '/reservations?tab=import', key: 'reservations.tab.import', match: 'import' as const },
  { href: '/reservations?track=1', key: 'reservations.tab.track', match: 'track' as const },
  { href: '/groups', key: 'reservations.tab.bulkGroups', match: 'groups-page' as const },
] as const;

function isActive(
  pathname: string,
  tab: string | null,
  mode: string | null,
  track: string | null,
  status: string | null,
  match: (typeof LINKS)[number]['match'],
) {
  if (match === 'calendar') return pathname === '/reservations/calendar' && mode !== 'filter-wizard';
  if (match === 'filter-wizard') return pathname === '/reservations/calendar' && mode === 'filter-wizard';
  if (match === 'list') return pathname === '/reservations' && !tab && track !== '1' && !status;
  if (match === 'new') return pathname === '/reservations/new';
  if (match === 'availability') return pathname === '/reservations' && tab === 'availability';
  if (match === 'egm') return pathname === '/reservations' && tab === 'egm';
  if (match === 'group') return pathname === '/reservations' && tab === 'group';
  if (match === 'group-codes') return pathname === '/reservations' && tab === 'group-codes';
  if (match === 'import') return pathname === '/reservations' && (tab === 'import' || tab === 'import-text' || tab === 'email');
  if (match === 'track') return pathname === '/reservations' && track === '1' && !tab;
  if (match === 'groups-page') return pathname === '/groups';
  return false;
}

export function ReservationModuleTabs({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const searchParams = useClientSearchParams();
  const tab = searchParams.get('tab');
  const mode = searchParams.get('mode');
  const track = searchParams.get('track');
  const status = searchParams.get('status');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeMode = mounted ? mode : null;

  return (
    <nav className={`roomio-rez-tabs${compact ? ' roomio-rez-tabs--compact' : ''}`} aria-label="Rezervasyon modülü">
      {LINKS.map((l) => {
        const active = l.match === 'external'
          ? pathname === l.href.split('?')[0]
          : isActive(pathname, tab, activeMode, track, status, l.match);
        return (
          <Link key={l.href} href={l.href} className={`roomio-rez-tab${active ? ' is-active' : ''}`}>
            {t(l.key)}
          </Link>
        );
      })}
    </nav>
  );
}
