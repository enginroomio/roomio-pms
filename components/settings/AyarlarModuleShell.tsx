'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AyarlarModuleLayout } from '@/components/settings/AyarlarModuleLayout';

export function buildAyarlarMenuSearch(pathname: string, params: URLSearchParams): string {
  if (pathname === '/settings/privacy') {
    const tab = params.get('tab');
    return tab ? `?tab=${tab}` : '';
  }
  if (pathname === '/settings/licensing') return '';

  const qs = new URLSearchParams();
  for (const key of ['hub', 'tab', 'tool', 'action', 'fixed'] as const) {
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

export function AyarlarModuleShell(props: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuSearch = buildAyarlarMenuSearch(pathname, searchParams);

  return <AyarlarModuleLayout {...props} menuSearch={menuSearch} />;
}
