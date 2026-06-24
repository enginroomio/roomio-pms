'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WifiOff } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';

export function OfflinePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (online) router.replace('/');
  }, [online, router]);

  return (
    <div className="roomio-offline-page">
      <div className="roomio-offline-card">
        <WifiOff size={40} aria-hidden />
        <h1>{t('offline.title')}</h1>
        <p>{t('offline.body')}</p>
        <div className="roomio-offline-actions">
          <button type="button" className="roomio-btn roomio-btn--primary" onClick={() => window.location.reload()}>
            {t('offline.retry')}
          </button>
          <Link href="/housekeeping/mobile" className="roomio-btn roomio-btn--secondary">
            {t('offline.hkLink')}
          </Link>
        </div>
        <nav className="roomio-offline-shortcuts" aria-label={t('offline.shortcuts')}>
          <p className="roomio-page-desc">{t('offline.shortcuts')}</p>
          <div className="roomio-offline-actions">
            <Link href="/" className="roomio-btn roomio-btn--ghost">{t('offline.home')}</Link>
            <Link href="/reception" className="roomio-btn roomio-btn--ghost">{t('offline.reception')}</Link>
            <Link href="/accounting" className="roomio-btn roomio-btn--ghost">{t('offline.accounting')}</Link>
            <Link href="/reports" className="roomio-btn roomio-btn--ghost">{t('offline.reports')}</Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
