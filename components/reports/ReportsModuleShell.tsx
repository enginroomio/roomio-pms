'use client';

import type { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  isArkaburoMenuContext,
  isGunsonuMenuContext,
} from '@/lib/navigation/module-menus';
import { ArkaBuroModuleLayout } from '@/components/accounting/ArkaBuroModuleLayout';
import { GunSonuModuleLayout } from '@/components/reports/GunSonuModuleLayout';
import { RaporlarModuleLayout } from '@/components/reports/RaporlarModuleLayout';

export function buildReportsMenuSearch(params: URLSearchParams): string {
  const qs = new URLSearchParams();
  for (const key of ['hub', 'tab', 'action', 'category', 'report', 'rpr', 'date', 'property'] as const) {
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

export function ReportsModuleShell(props: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuSearch = buildReportsMenuSearch(searchParams);

  if (isGunsonuMenuContext(pathname, menuSearch)) {
    return <GunSonuModuleLayout {...props} menuSearch={menuSearch} />;
  }
  if (isArkaburoMenuContext(pathname, menuSearch)) {
    return <ArkaBuroModuleLayout {...props} menuSearch={menuSearch} />;
  }
  return <RaporlarModuleLayout {...props} menuSearch={menuSearch} />;
}
