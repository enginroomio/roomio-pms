'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BedDouble,
  Heart,
  Home,
  Settings,
  Wallet,
} from 'lucide-react';
import { ICON_RAIL } from '@/lib/navigation/top-menu-nav';

const icons = {
  home: Home,
  wallet: Wallet,
  'bed-double': BedDouble,
  heart: Heart,
  'bar-chart': BarChart3,
  settings: Settings,
};

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function IconRail() {
  const pathname = usePathname();

  return (
    <aside className="roomio-icon-rail" aria-label="Hızlı modüller">
      <Link href="/" className="roomio-icon-rail__logo" aria-label="Roomio Ana Sayfa">
        <span /><span /><span /><span />
      </Link>
      <div className="roomio-icon-rail__items">
        {ICON_RAIL.map((item, index) => {
          const Icon = icons[item.icon as keyof typeof icons] ?? Home;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`roomio-icon-rail__btn${active ? ' is-active' : ''}`}
              title={`${item.label} (Alt+${index + 1})`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
