'use client';

import { useEffect } from 'react';

function isStaleChunkError(message: string): boolean {
  return (
    message.includes('ChunkLoadError')
    || message.includes('Loading chunk')
    || message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
  );
}

async function clearPwaCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export function PwaRegister() {
  useEffect(() => {
    let recovering = false;

    const onError = (event: ErrorEvent) => {
      const message = String(event.message ?? event.error ?? '');
      if (!isStaleChunkError(message) || recovering) return;
      recovering = true;
      void clearPwaCaches().finally(() => {
        window.location.reload();
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const message = String(event.reason?.message ?? event.reason ?? '');
      if (!isStaleChunkError(message) || recovering) return;
      recovering = true;
      void clearPwaCaches().finally(() => {
        window.location.reload();
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
      };
    }

    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              void reg.update();
            }
          });
        });
      })
      .catch(() => undefined);

    const onOffline = () => {
      if (!navigator.onLine && !window.location.pathname.startsWith('/housekeeping')) {
        const skip = ['/offline', '/login', '/setup', '/wifi'].some((p) =>
          window.location.pathname.startsWith(p),
        );
        if (!skip) {
          window.location.assign('/offline');
        }
      }
    };

    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return null;
}
