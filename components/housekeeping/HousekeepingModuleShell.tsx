'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { KatModuleLayout } from '@/components/housekeeping/KatModuleLayout';

export function buildHousekeepingMenuSearch(params: URLSearchParams): string {
  const hub = params.get('hub');
  if (hub) return `?hub=${hub}`;

  const qs = new URLSearchParams();
  for (const key of ['tab', 'view', 'filter'] as const) {
    const value = params.get(key);
    if (value) qs.set(key, value);
  }
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : '';
}

type Props = {
  title: string;
  description?: string;
  segment?: string | string[];
  breadcrumb?: string;
  actions?: ReactNode;
  hideTitle?: boolean;
  children: ReactNode;
};

export function HousekeepingModuleShell(props: Props) {
  const searchParams = useSearchParams();
  const menuSearch = buildHousekeepingMenuSearch(searchParams);

  return <KatModuleLayout {...props} menuSearch={menuSearch} />;
}
