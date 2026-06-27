'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider';
import { DIL_TANIMLARI_TABS, type DilTanimlariSection } from '@/lib/navigation/dil-tanimlari';

type Props = {
  active: DilTanimlariSection;
};

export function DilTanimlariTabs({ active }: Props) {
  const { t } = useI18n();

  return (
    <nav className="roomio-tabs" aria-label={t('dil.tabsLabel')}>
      {DIL_TANIMLARI_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`roomio-tab${active === tab.id ? ' is-active' : ''}`}
        >
          {t(tab.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
