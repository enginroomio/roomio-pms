'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';

/** Üst şerit — çevrimdışı mod uyarısı */
export function PwaOfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="roomio-offline-banner" role="status">
      <WifiOff size={14} aria-hidden />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
