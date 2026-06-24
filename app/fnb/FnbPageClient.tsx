'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useI18n } from '@/components/i18n/I18nProvider';
import { BanketEventsPanel } from '@/components/fnb/BanketEventsPanel';
import { FnbQuickPosPanel } from '@/components/fnb/FnbQuickPosPanel';

export default function FnbPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const title = mode === 'quick'
    ? t('fnb.title.quickPos')
    : mode === 'card-prep'
      ? t('fnb.title.cardPrep')
      : t('fnb.title.banket');

  return (
    <ModuleLayout
      breadcrumb={t('fnb.breadcrumb')}
      title={title}
      description={t('fnb.desc')}
      sideTitle={t('fnb.sideTitle')}
    >
      <nav className="roomio-tabs">
        <Link href="/fnb" className={`roomio-tab${!mode ? ' is-active' : ''}`}>{t('fnb.tab.banket')}</Link>
        <Link href="/fnb?mode=quick" className={`roomio-tab${mode === 'quick' ? ' is-active' : ''}`}>{t('fnb.tab.quickPos')}</Link>
        <Link href="/fnb?mode=card-prep" className={`roomio-tab${mode === 'card-prep' ? ' is-active' : ''}`}>{t('fnb.tab.cardPrep')}</Link>
      </nav>

      {!mode ? <BanketEventsPanel /> : <FnbQuickPosPanel cardPrep={mode === 'card-prep'} />}
    </ModuleLayout>
  );
}
