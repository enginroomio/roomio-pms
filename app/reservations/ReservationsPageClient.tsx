'use client';

import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { ReservationEgmTab } from '@/components/egm/ReservationEgmTab';
import { ReservationListView } from '@/components/reservations/ReservationListView';
import { ReservationModuleTabs } from '@/components/reservations/ReservationModuleTabs';
import { AvailabilityCalendar } from '@/app/reservations/AvailabilityCalendar';
import { useReservations } from '@/lib/client/use-reservations';
import { GroupReservationsPanel } from '@/components/reservations/GroupReservationsPanel';
import { GroupCodesPanel } from '@/components/reservations/GroupCodesPanel';
import { ReservationImportPanel } from '@/components/reservations/ReservationImportPanel';
import {
  normalizeReservationTab,
  reservationListTabFromParams,
} from '@/lib/navigation/menu-route-params';
import { RezervasyonHubPanel } from '@/components/reservations/RezervasyonHubPanel';

export function ReservationsPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const tab = normalizeReservationTab(searchParams.get('tab'));
  const trackMode = searchParams.get('track') === '1';
  const showPrices = searchParams.get('prices') === '1';
  const statusParam = searchParams.get('status');
  const listTabFromUrl = reservationListTabFromParams(
    statusParam,
    searchParams.get('track'),
  );
  const { reservations, loading, error, reload } = useReservations();

  if (hub === 'rezervasyon' && !tab && !statusParam && !trackMode) {
    return (
      <PageHeader
        breadcrumb="Rezervasyon"
        title="Rezervasyon Merkezi"
        description="Grafik, liste, aktarım ve blokaj işlemleri."
      >
        <ReservationModuleTabs compact />
        <RezervasyonHubPanel />
      </PageHeader>
    );
  }

  const isListView = !tab;
  const showListLoading = isListView && loading;
  const showListError = isListView && error;
  const title = tab === 'availability'
    ? showPrices
      ? 'Oda Müsaitlik (Fiyatlı)'
      : t('reservations.title.availability')
    : tab === 'egm'
      ? t('reservations.title.egm')
        : tab === 'group'
          ? t('reservations.title.group')
          : tab === 'group-codes'
            ? 'Grup Kod Listesi'
            : tab === 'import' || tab === 'import-text'
          ? 'Acenta Rezervasyon Aktarım'
          : tab === 'email'
            ? 'Mailden Rezervasyon Oku'
            : t('reservations.title.list');

  return (
    <PageHeader
      breadcrumb={isListView ? undefined : `${t('nav.reservations')} › ${title}`}
      title={isListView ? '' : title}
      description={
        tab === 'egm'
          ? t('reservations.description.egm')
          : isListView
            ? undefined
            : t('reservations.description')
      }
      actions={
        isListView ? undefined : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
              {loading ? t('reservations.loading') : t('reservations.refresh')}
            </Button>
            <Button variant="secondary" href="/api/reports/export?format=csv">{t('reservations.exportCsv')}</Button>
            <Button href="/reservations/new">{t('reservations.new')}</Button>
          </div>
        )
      }
      stackClassName={isListView ? 'roomio-page-stack--rez-list' : undefined}
      hideHeader={isListView}
    >
      <ReservationModuleTabs compact={isListView} />

      {showListLoading ? (
        <p className="roomio-page-desc">{t('reservations.loadingList')}</p>
      ) : showListError ? (
        <p className="roomio-page-desc roomio-text-warn">{error}</p>
      ) : tab === 'availability' ? (
        <AvailabilityCalendar showPrices={showPrices} />
      ) : tab === 'egm' ? (
        <ReservationEgmTab
          reservations={reservations}
          onRefreshReservations={() => { void reload(); }}
        />
      ) : tab === 'group' ? (
        <GroupReservationsPanel />
      ) : tab === 'group-codes' ? (
        <GroupCodesPanel />
      ) : tab === 'import' ? (
        <ReservationImportPanel mode="file" onImported={() => void reload()} />
      ) : tab === 'import-text' ? (
        <ReservationImportPanel mode="text" onImported={() => void reload()} />
      ) : tab === 'email' ? (
        <ReservationImportPanel mode="email" onImported={() => void reload()} />
      ) : (
        <ReservationListView
          reservations={reservations}
          onRefresh={() => void reload()}
          initialListTab={listTabFromUrl ?? undefined}
          trackMode={trackMode}
        />
      )}
    </PageHeader>
  );
}
