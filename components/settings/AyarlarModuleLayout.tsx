'use client';

import type { ReactNode } from 'react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { ayarlarModuleLayoutDefaults } from '@/lib/navigation/ayarlar-layout';

type Props = {
  title: string;
  description?: string;
  menuSearch: string;
  segment?: string | string[];
  breadcrumb?: string;
  actions?: ReactNode;
  hideTitle?: boolean;
  children: ReactNode;
};

export function AyarlarModuleLayout({
  title,
  description,
  menuSearch,
  segment,
  breadcrumb,
  actions,
  hideTitle,
  children,
}: Props) {
  const segments = segment == null ? [] : Array.isArray(segment) ? segment : [segment];
  const layout = ayarlarModuleLayoutDefaults(menuSearch, ...segments);

  return (
    <ModuleLayout
      breadcrumb={breadcrumb ?? layout.breadcrumb}
      title={title}
      description={description}
      actions={actions}
      sideTitle={layout.sideTitle}
      menuItems={layout.menuItems}
      menuSearch={layout.menuSearch}
      hideTitle={hideTitle}
    >
      {children}
    </ModuleLayout>
  );
}
