export type HkBrowserNotificationResult = {
  ok: boolean;
  method?: 'service-worker' | 'page';
  error?: string;
  permission: NotificationPermission | 'unsupported';
};

async function waitForServiceWorkerControl(timeoutMs = 4000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return reg;

    await Promise.race([
      new Promise<void>((resolve) => {
        const onChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', onChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onChange);
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
    ]);

    return reg;
  } catch {
    return null;
  }
}

/** Tarayıcı bildirimi — önce service worker (Mac Chrome), sonra sayfa API. */
export async function showHkBrowserNotification(
  body: string,
  title = 'Roomio HK',
): Promise<HkBrowserNotificationResult> {
  if (!('Notification' in window)) {
    return { ok: false, permission: 'unsupported', error: 'Notification API yok' };
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return {
      ok: false,
      permission,
      error: permission === 'denied' ? 'Site bildirim izni reddedildi' : 'Site bildirim izni verilmedi',
    };
  }

  const options: NotificationOptions = {
    body,
    tag: 'roomio-hk-test',
    silent: false,
  };

  if ('serviceWorker' in navigator) {
    const reg = await waitForServiceWorkerControl();
    if (reg?.showNotification) {
      try {
        await reg.showNotification(title, options);
        return { ok: true, method: 'service-worker', permission };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Service worker bildirimi başarısız';
        try {
          new Notification(title, options);
          return { ok: true, method: 'page', permission };
        } catch (pageErr) {
          return {
            ok: false,
            permission,
            error: pageErr instanceof Error ? pageErr.message : message,
          };
        }
      }
    }
  }

  try {
    new Notification(title, options);
    return { ok: true, method: 'page', permission };
  } catch (err) {
    return {
      ok: false,
      permission,
      error: err instanceof Error ? err.message : 'Bildirim gösterilemedi',
    };
  }
}

export async function browserHasPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg || !('pushManager' in reg)) return false;
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}
