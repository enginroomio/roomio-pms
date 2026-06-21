/** Tarayıcı bildirimi — önce sayfa API, sonra service worker. */
export async function showHkBrowserNotification(body: string, title = 'Roomio HK'): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, { body, tag: 'roomio-hk-page', renotify: true });
    return true;
  } catch {
    // Page Notification API can fail when SW owns notifications — fall through.
  }

  if (!('serviceWorker' in navigator)) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag: 'roomio-hk-sw', renotify: true });
    return true;
  } catch {
    return false;
  }
}
