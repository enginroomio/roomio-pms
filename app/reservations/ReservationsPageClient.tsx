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

export function ReservationsPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { reservations, loading, error, reload } = useReservations();

  const title = tab === 'availability'
    ? t('reservations.title.availability')
    : tab === 'egm'
      ? t('reservations.title.egm')
      : tab === 'group'
        ? t('reservations.title.group')
        : t('reservations.title.list');

  return (
    <PageHeader
      breadcrumb={`${t('nav.reservations')} › ${title}`}
      title={title}
      description={tab === 'egm' ? t('reservations.description.egm') : t('reservations.description')}
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
            {loading ? t('reservations.loading') : t('reservations.refresh')}
          </Button>
          <Button variant="secondary" href="/api/reports/export?format=csv">{t('reservations.exportCsv')}</Button>
          <Button href="/reservations/new">{t('reservations.new')}</Button>
        </div>
      }
    >
      <ReservationModuleTabs />

      {loading ? (
        <p className="roomio-page-desc">{t('reservations.loadingList')}</p>
      ) : error ? (
        <p className="roomio-page-desc roomio-text-warn">{error}</p>
      ) : tab === 'availability' ? (
        <AvailabilityCalendar />
      ) : tab === 'egm' ? (
        <ReservationEgmTab
          reservations={reservations}
          onRefreshReservations={() => { void reload(); }}
        />
      ) : tab === 'group' ? (
        <GroupReservationsPanel />
      ) : (
        <ReservationListView reservations={reservations} />
      )}
    </PageHeader>
  );
}
