'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TOP_MENU_GROUPS, topMenuItems } from '@/lib/navigation/top-menu-nav';
import { navItemActive, type SidebarNavItem } from '@/lib/navigation/sidebar-nav';
import { useI18n } from '@/components/i18n/I18nProvider';

function FlyoutTree({ items, onNavigate }: { items: SidebarNavItem[]; onNavigate: () => void }) {
  return (
    <>
      {items.map((item) => {
        if (item.separator) return <div key={item.id} className="roomio-top-menu__sep" role="separator" />;
        if (item.children?.length) {
          return (
            <div key={item.id} className="roomio-top-menu__branch">
              <span className="roomio-top-menu__branch-btn">
                {item.label}
                <ChevronRight size={14} />
              </span>
              <div className="roomio-top-menu__flyout">
                <FlyoutTree items={item.children} onNavigate={onNavigate} />
              </div>
            </div>
          );
        }
        return (
          <Link
            key={item.id}
            href={item.href ?? '#'}
            className="roomio-top-menu__link"
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function TopMenuNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  function groupActive(groupId: string) {
    return topMenuItems(groupId).some((item) => navItemActive(pathname, item));
  }

  return (
    <nav className="roomio-top-menu" aria-label="Ana menü">
      {TOP_MENU_GROUPS.map((group) => {
        const open = openId === group.id;
        const items = topMenuItems(group.id);
        return (
          <div
            key={group.id}
            className={`roomio-top-menu__group${open ? ' is-open' : ''}${groupActive(group.id) ? ' is-active' : ''}`}
            onMouseEnter={() => setOpenId(group.id)}
            onMouseLeave={() => setOpenId((id) => (id === group.id ? null : id))}
          >
            <button type="button" className="roomio-top-menu__trigger" aria-expanded={open}>
              {t(`menu.${group.id}`, undefined, group.label)}
            </button>
            {open ? (
              <div className="roomio-top-menu__panel">
                <FlyoutTree items={items} onNavigate={() => setOpenId(null)} />
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
