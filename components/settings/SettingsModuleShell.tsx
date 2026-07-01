'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { isAyarlarMenuContext, type ModuleNavItem } from '@/lib/navigation/module-menus';
import { AyarlarModuleShell } from '@/components/settings/AyarlarModuleShell';

export function buildSettingsMenuSearch(pathname: string, params: URLSearchParams): string {
  if (pathname === '/settings/privacy') {
    const tab = params.get('tab');
    return tab ? `?tab=${tab}` : '';
  }
  if (pathname === '/settings/licensing') return '';

  const qs = new URLSearchParams();
  for (const key of ['hub', 'section', 'tab', 'tool', 'action', 'fixed'] as const) {
    const value = params.get(key);
    if (value) qs.set(key, value);
  }
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : '';
}

type Props = {
  title: string;
  description?: string;
  breadcrumb?: string;
  sideTitle?: string;
  menuItems?: ModuleNavItem[];
  children: ReactNode;
};

export function SettingsModuleShell({
  title,
  description,
  breadcrumb,
  sideTitle,
  menuItems,
  children,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuSearch = buildSettingsMenuSearch(pathname, searchParams);

  if (isAyarlarMenuContext(pathname, menuSearch)) {
    return (
      <AyarlarModuleShell title={title} description={description} breadcrumb={breadcrumb}>
        {children}
      </AyarlarModuleShell>
    );
  }

  return (
    <ModuleLayout
      breadcrumb={breadcrumb ?? 'Kuruluş'}
      title={title}
      description={description}
      sideTitle={sideTitle}
      menuItems={menuItems}
      menuSearch={menuSearch}
    >
      {children}
    </ModuleLayout>
  );
}
