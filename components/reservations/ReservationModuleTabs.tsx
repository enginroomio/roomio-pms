'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const LINKS = [
  { href: '/reservations/calendar', label: 'Grafikler (F1)', match: 'calendar' as const },
  { href: '/reservations', label: 'Rezervasyon Listesi', match: 'list' as const },
  { href: '/reservations/new', label: 'Yeni Rezervasyon (F2)', match: 'new' as const },
  { href: '/reception/inhouse', label: 'Konaklayanlar', match: 'external' as const },
  { href: '/reception/vacant', label: 'Boş Oda Listesi', match: 'external' as const },
  { href: '/rooms?tab=blocking', label: 'Hızlı Blokaj', match: 'external' as const },
  { href: '/reservations?tab=availability', label: 'Oda Planı', match: 'availability' as const },
  { href: '/reservations?tab=egm', label: 'EGM Kimlik', match: 'egm' as const },
];

function isActive(pathname: string, tab: string | null, match: (typeof LINKS)[number]['match']) {
  if (match === 'calendar') return pathname === '/reservations/calendar';
  if (match === 'list') return pathname === '/reservations' && !tab;
  if (match === 'new') return pathname === '/reservations/new';
  if (match === 'availability') return pathname === '/reservations' && tab === 'availability';
  if (match === 'egm') return pathname === '/reservations' && tab === 'egm';
  return false;
}

export function ReservationModuleTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return (
    <nav className="roomio-rez-tabs" aria-label="Rezervasyon modülü">
      {LINKS.map((l) => {
        const active = l.match === 'external'
          ? pathname === l.href.split('?')[0]
          : isActive(pathname, tab, l.match);
        return (
          <Link key={l.href} href={l.href} className={`roomio-rez-tab${active ? ' is-active' : ''}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
