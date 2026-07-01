'use client';

import type { ReactNode } from 'react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { rezervasyonModuleLayoutDefaults } from '@/lib/navigation/rezervasyon-layout';

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

export function RezervasyonModuleLayout({
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
  const layout = rezervasyonModuleLayoutDefaults(menuSearch, ...segments);

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
