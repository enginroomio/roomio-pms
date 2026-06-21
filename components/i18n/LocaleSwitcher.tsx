'use client';

import { useI18n, type Locale } from '@/components/i18n/I18nProvider';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <select
      className="roomio-select roomio-select--sm roomio-locale-switch"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t('locale.switch')}
    >
      <option value="tr">TR</option>
      <option value="en">EN</option>
    </select>
  );
}
