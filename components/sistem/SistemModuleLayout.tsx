'use client';

import type { ReactNode } from 'react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { sistemModuleLayoutDefaults } from '@/lib/navigation/sistem-layout';

type Props = {
  title: string;
  description?: string;
  menuSearch: string;
  /** Breadcrumb segmentleri — kök "Sistem" otomatik eklenir */
  segment?: string | string[];
  breadcrumb?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SistemModuleLayout({
  title,
  description,
  menuSearch,
  segment,
  breadcrumb,
  actions,
  children,
}: Props) {
  const segments = segment == null ? [] : Array.isArray(segment) ? segment : [segment];
  const layout = sistemModuleLayoutDefaults(menuSearch, ...segments);

  return (
    <ModuleLayout
      breadcrumb={breadcrumb ?? layout.breadcrumb}
      title={title}
      description={description}
      actions={actions}
      sideTitle={layout.sideTitle}
      menuItems={layout.menuItems}
      menuSearch={layout.menuSearch}
    >
      {children}
    </ModuleLayout>
  );
}
