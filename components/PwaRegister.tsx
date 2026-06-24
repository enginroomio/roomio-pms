'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

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
        const skip = ['/offline', '/login', '/wifi'].some((p) => window.location.pathname.startsWith(p));
        if (!skip) {
          window.location.assign('/offline');
        }
      }
    };

    window.addEventListener('offline', onOffline);
    return () => window.removeEventListener('offline', onOffline);
  }, []);

  return null;
}
