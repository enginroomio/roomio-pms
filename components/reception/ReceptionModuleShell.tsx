'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { isOnkasaMenuContext } from '@/lib/navigation/module-menus';
import { OnKasaModuleLayout } from '@/components/onkasa/OnKasaModuleLayout';
import { ResepsiyonModuleLayout } from '@/components/resepsiyon/ResepsiyonModuleLayout';

export function buildReceptionMenuSearch(params: URLSearchParams): string {
  const hub = params.get('hub');
  if (hub) return `?hub=${hub}`;

  const qs = new URLSearchParams();
  for (const key of ['tab', 'action', 'room', 'q', 'new'] as const) {
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
  /** Ön kasa bağlamını yok say — alt sayfalarda resepsiyon yan menüsü */
  forceResepsiyon?: boolean;
};

export function ReceptionModuleShell({ forceResepsiyon, ...props }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuSearch = buildReceptionMenuSearch(searchParams);
  const search = menuSearch.replace(/^\?/, '');
  const onkasa = !forceResepsiyon && isOnkasaMenuContext(pathname, search);

  if (onkasa) {
    return <OnKasaModuleLayout {...props} menuSearch={menuSearch} />;
  }

  return <ResepsiyonModuleLayout {...props} menuSearch={menuSearch} />;
}
