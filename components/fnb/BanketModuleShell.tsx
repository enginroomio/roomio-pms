'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { BanketModuleLayout } from '@/components/fnb/BanketModuleLayout';

export function buildBanketMenuSearch(params: URLSearchParams): string {
  const hub = params.get('hub');
  if (hub) return `?hub=${hub}`;

  const qs = new URLSearchParams();
  for (const key of ['tab', 'mode'] as const) {
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

export function BanketModuleShell(props: Props) {
  const searchParams = useSearchParams();
  const menuSearch = buildBanketMenuSearch(searchParams);

  return <BanketModuleLayout {...props} menuSearch={menuSearch} />;
}
