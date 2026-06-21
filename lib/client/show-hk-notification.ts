/** Tarayıcı bildirimi — önce service worker (Mac Chrome), sonra sayfa API. */
export async function showHkBrowserNotification(body: string, title = 'Roomio HK'): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    tag: 'roomio-hk',
    // SVG icon Chrome macOS'ta bildirimi sessizce bozabiliyor — icon yok
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return true;
    } catch {
      // SW bildirimi başarısız — sayfa API dene
    }
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
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
