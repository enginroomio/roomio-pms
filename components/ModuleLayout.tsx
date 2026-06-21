'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { moduleMenuForPath } from '@/lib/navigation/module-menus';
import { ModuleSideNav } from '@/components/ModuleSideNav';

type Props = {
  breadcrumb: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  sideTitle?: string;
  menuSearch?: string;
  children: ReactNode;
};

export function ModuleLayout({
  breadcrumb,
  title,
  description,
  actions,
  sideTitle,
  menuSearch = '',
  children,
}: Props) {
  const pathname = usePathname();
  const menu = moduleMenuForPath(pathname, menuSearch);

  return (
    <div className="roomio-module-layout">
      <div className="roomio-page-header roomio-module-layout__head">
        <div>
          <div className="roomio-breadcrumb">{breadcrumb}</div>
          <h1 className="roomio-page-title">{title}</h1>
          {description ? <p className="roomio-page-desc">{description}</p> : null}
        </div>
        {actions}
      </div>

      <div className={`roomio-module-layout__body${menu ? '' : ' roomio-module-layout__body--full'}`}>
        {menu ? (
          <ModuleSideNav
            title={sideTitle ?? breadcrumb.split('›').pop()?.trim() ?? 'Menü'}
            items={menu}
            variant={menu.length > 14 ? 'deep' : 'default'}
            menuSearch={menuSearch}
          />
        ) : null}
        <div className="roomio-module-layout__content">{children}</div>
      </div>
    </div>
  );
}
