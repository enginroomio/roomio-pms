'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { MisafirModuleLayout } from '@/components/guest-relations/MisafirModuleLayout';

export function buildGuestRelationsMenuSearch(params: URLSearchParams): string {
  const hub = params.get('hub');
  if (hub) return `?hub=${hub}`;

  const qs = new URLSearchParams();
  for (const key of ['tab', 'type', 'view', 'action', 'toggle', 'new', 'format'] as const) {
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

export function GuestRelationsModuleShell(props: Props) {
  const searchParams = useSearchParams();
  const menuSearch = buildGuestRelationsMenuSearch(searchParams);

  return <MisafirModuleLayout {...props} menuSearch={menuSearch} />;
}
