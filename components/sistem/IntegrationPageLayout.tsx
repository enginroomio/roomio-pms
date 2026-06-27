'use client';

import type { ReactNode } from 'react';
import { SistemIntegrationActions } from '@/components/sistem/SistemIntegrationActions';
import { SistemModuleLayout } from '@/components/sistem/SistemModuleLayout';

type Props = {
  title: string;
  description?: string;
  /** Breadcrumb: Sistem › Entegrasyonlar › … */
  segment: string | string[];
  menuSearch?: string;
  actions?: ReactNode;
  children: ReactNode;
};

/** Servis programları altındaki entegrasyon detay sayfaları */
export function IntegrationPageLayout({
  title,
  description,
  segment,
  menuSearch = '',
  actions,
  children,
}: Props) {
  const segments = Array.isArray(segment) ? segment : [segment];

  return (
    <SistemModuleLayout
      segment={['Entegrasyonlar', ...segments]}
      title={title}
      description={description}
      menuSearch={menuSearch}
      actions={
        actions ? (
          <div className="roomio-quick-actions">
            {actions}
            <SistemIntegrationActions />
          </div>
        ) : (
          <SistemIntegrationActions />
        )
      }
    >
      {children}
    </SistemModuleLayout>
  );
}
