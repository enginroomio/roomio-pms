'use client';

import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import { BanketModuleShell } from '@/components/fnb/BanketModuleShell';
import { BanketEventsPanel } from '@/components/fnb/BanketEventsPanel';
import { BanketCatalogPanel } from '@/components/fnb/BanketCatalogPanel';
import {
  BanketAgreementsPanel,
  BanketCalendarPanel,
  BanketDefinitionsHub,
  BanketReportsHub,
} from '@/components/fnb/BanketOperationsPanels';
import { FnbQuickPosPanel } from '@/components/fnb/FnbQuickPosPanel';
import { PosDiscountsPanel } from '@/components/fnb/PosDiscountsPanel';
import { BanketHubPanel } from '@/components/fnb/BanketHubPanel';

const CATALOG_TABS = new Set([
  'halls', 'menus', 'rates', 'equipment', 'restaurant',
]);

const CATALOG_LABELS: Record<string, string> = {
  halls: 'Salon Tanımları',
  menus: 'Menü Paketleri',
  rates: 'Banket Fiyatları',
  equipment: 'Ekipman Listesi',
  restaurant: 'Restoran Tanımları',
  definitions: 'Banket İlk Tanımlar',
  reports: 'Banket Raporları',
  discounts: 'İndirim Tanımları (POS)',
  agreements: 'Banket Anlaşmaları',
  calendar: 'Banket Ajanda',
};

export default function FnbPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const hub = searchParams.get('hub');
  const tab = searchParams.get('tab');

  if (hub === 'banket' && !mode && !tab) {
    return (
      <BanketModuleShell segment="Merkezi" title="Banket Merkezi" description={t('fnb.desc')}>
        <BanketHubPanel />
      </BanketModuleShell>
    );
  }

  const title = mode === 'quick'
    ? t('fnb.title.quickPos')
    : mode === 'card-prep'
      ? t('fnb.title.cardPrep')
      : tab && CATALOG_LABELS[tab]
        ? CATALOG_LABELS[tab]
        : t('fnb.title.banket');

  const segment = tab && CATALOG_LABELS[tab]
    ? CATALOG_LABELS[tab]
    : mode === 'quick'
      ? 'Hızlı POS'
      : mode === 'card-prep'
        ? 'POS Kart Hazırlama'
        : 'Rezervasyon';

  return (
    <BanketModuleShell segment={segment} title={title} description={t('fnb.desc')}>
      {mode ? (
        <FnbQuickPosPanel cardPrep={mode === 'card-prep'} />
      ) : tab === 'calendar' ? (
        <BanketCalendarPanel />
      ) : tab === 'agreements' ? (
        <BanketAgreementsPanel />
      ) : tab === 'definitions' ? (
        <BanketDefinitionsHub />
      ) : tab === 'reports' ? (
        <BanketReportsHub />
      ) : tab && CATALOG_TABS.has(tab) ? (
        <BanketCatalogPanel tab={tab as 'halls' | 'menus' | 'rates' | 'equipment' | 'restaurant'} />
      ) : tab === 'discounts' ? (
        <PosDiscountsPanel />
      ) : (
        <BanketEventsPanel />
      )}
    </BanketModuleShell>
  );
}
