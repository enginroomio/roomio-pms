'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ModuleNavItem } from '@/lib/navigation/module-menus';

type Props = {
  title: string;
  items: ModuleNavItem[];
  variant?: 'default' | 'deep';
  menuSearch?: string;
};

function navActive(pathname: string, search: string, href: string): boolean {
  const base = href.split('?')[0];
  const query = href.includes('?') ? href.split('?')[1] : '';
  const current = search ? `${pathname}?${search.replace(/^\?/, '')}` : pathname;

  if (query) {
    if (href.includes('phase=')) return current === href;
    if (query.startsWith('section=language') && pathname === '/settings' && search) {
      const sec = new URLSearchParams(search).get('section');
      if (
        sec === 'language' ||
        sec === 'lang-forms' ||
        sec === 'lang-menus' ||
        sec === 'lang-reports' ||
        sec === 'nationalities'
      ) {
        return true;
      }
    }
    return current === href || current.startsWith(`${href}&`);
  }
  if (base === '/') return pathname === '/';
  if (
    base === '/reception' ||
    base === '/housekeeping' ||
    base === '/guest-relations' ||
    base === '/accounting' ||
    base === '/settings' ||
    base === '/reports' ||
    base === '/tools/sistem' ||
    base === '/reservations' ||
    base === '/reservations/calendar'
  ) {
    return pathname === base && !search;
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

function branchActive(item: ModuleNavItem, pathname: string, search: string): boolean {
  if (!item.separator && navActive(pathname, search, item.href)) return true;
  return item.children?.some((child) => branchActive(child, pathname, search)) ?? false;
}

function NavBranch({
  item,
  depth,
  pathname,
  search,
}: {
  item: ModuleNavItem;
  depth: number;
  pathname: string;
  search: string;
}) {
  const active = branchActive(item, pathname, search);

  if (item.children?.length) {
    return (
      <div className="roomio-module-side__branch">
        {item.href && item.href !== '#' ? (
          <Link
            href={item.href}
            className={`roomio-module-side__link${active ? ' is-active' : ''}`}
          >
            {item.label}
            <ChevronRight size={13} className={active ? ' is-open' : ''} />
          </Link>
        ) : (
          <div className={`roomio-module-side__label${active ? ' is-active' : ''}`}>
            {item.label}
            <ChevronRight size={13} className={active ? ' is-open' : ''} />
          </div>
        )}
        {active ? (
          <div className="roomio-module-side__children">
            {item.children.map((child) => (
              <NavBranch key={child.id} item={child} depth={depth + 1} pathname={pathname} search={search} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`roomio-module-side__link${active ? ' is-active' : ''}`}
      style={depth > 0 ? { paddingLeft: 12 + depth * 10 } : undefined}
    >
      {item.label}
    </Link>
  );
}

export function ModuleSideNav({ title, items, variant = 'default', menuSearch = '' }: Props) {
  const pathname = usePathname();
  const search = menuSearch.replace(/^\?/, '');

  return (
    <nav className={`roomio-module-side${variant === 'deep' ? ' roomio-module-side--deep' : ''}`} aria-label={title}>
      <div className="roomio-module-side__title">{title}</div>
      <div className="roomio-module-side__items">
        {items.map((item) => {
          if (item.separator) return <div key={item.id} className="roomio-module-side__sep" role="separator" />;
          if (item.children?.length) {
            return <NavBranch key={item.id} item={item} depth={0} pathname={pathname} search={search} />;
          }
          const active = navActive(pathname, search, item.href);
          return (
            <Link key={item.id} href={item.href} className={`roomio-module-side__link${active ? ' is-active' : ''}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
