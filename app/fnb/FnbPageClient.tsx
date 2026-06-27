'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useI18n } from '@/components/i18n/I18nProvider';
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
      <ModuleLayout
        breadcrumb="Banket"
        title="Banket Merkezi"
        description={t('fnb.desc')}
        sideTitle={t('fnb.sideTitle')}
      >
        <BanketHubPanel />
      </ModuleLayout>
    );
  }

  const title = mode === 'quick'
    ? t('fnb.title.quickPos')
    : mode === 'card-prep'
      ? t('fnb.title.cardPrep')
      : tab && CATALOG_LABELS[tab]
        ? CATALOG_LABELS[tab]
        : t('fnb.title.banket');

  return (
    <ModuleLayout
      breadcrumb={t('fnb.breadcrumb')}
      title={title}
      description={t('fnb.desc')}
      sideTitle={t('fnb.sideTitle')}
    >
      <nav className="roomio-tabs">
        <Link href="/fnb" className={`roomio-tab${!mode && !tab ? ' is-active' : ''}`}>{t('fnb.tab.banket')}</Link>
        <Link href="/fnb?tab=calendar" className={`roomio-tab${tab === 'calendar' ? ' is-active' : ''}`}>Ajanda</Link>
        <Link href="/fnb?tab=agreements" className={`roomio-tab${tab === 'agreements' ? ' is-active' : ''}`}>Anlaşmalar</Link>
        <Link href="/fnb?mode=quick" className={`roomio-tab${mode === 'quick' ? ' is-active' : ''}`}>{t('fnb.tab.quickPos')}</Link>
        <Link href="/fnb?tab=definitions" className={`roomio-tab${tab === 'definitions' ? ' is-active' : ''}`}>Tanımlar</Link>
        <Link href="/fnb?tab=reports" className={`roomio-tab${tab === 'reports' ? ' is-active' : ''}`}>Raporlar</Link>
      </nav>

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
    </ModuleLayout>
  );
}
