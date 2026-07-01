'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArkaBuroModuleLayout } from '@/components/accounting/ArkaBuroModuleLayout';

export function buildArkaburoMenuSearch(params: URLSearchParams): string {
  const qs = new URLSearchParams();
  for (const key of ['hub', 'tab', 'new'] as const) {
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

export function ArkaBuroModuleShell(props: Props) {
  const searchParams = useSearchParams();
  const menuSearch = buildArkaburoMenuSearch(searchParams);

  return <ArkaBuroModuleLayout {...props} menuSearch={menuSearch} />;
}
