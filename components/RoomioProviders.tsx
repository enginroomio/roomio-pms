'use client';

import { useEffect } from 'react';
import { isOnline, runSync, seedLocalDbIfEmpty } from '@/lib/sync/engine';
import { appendAudit } from '@/lib/kvkk';
import { ViewportProvider } from '@/components/ViewportProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { PropertyProvider } from '@/components/property/PropertyProvider';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { PwaRegister } from '@/components/PwaRegister';

export function RoomioProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    const bootstrap = () => {
      if (cancelled) return;
      void seedLocalDbIfEmpty().then(() => {
        if (cancelled) return;
        appendAudit({ user: 'Arda Y.', action: 'login', resource: 'app', success: true });
        if (isOnline()) void runSync();
      });
    };

    // İlk boyamayı bloklamamak için senkronu ertele
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(bootstrap, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(bootstrap, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onOnline = () => void runSync();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <SessionProvider>
      <PropertyProvider>
        <I18nProvider>
          <ThemeProvider>
            <PwaRegister />
            <ViewportProvider>{children}</ViewportProvider>
          </ThemeProvider>
        </I18nProvider>
      </PropertyProvider>
    </SessionProvider>
  );
}
