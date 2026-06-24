const CACHE = 'roomio-pms-v11';
const OFFLINE_URL = '/offline';

const SHELL = [
  '/',
  '/login',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.svg',
  '/housekeeping',
  '/housekeeping/mobile',
  '/housekeeping/rooms',
  '/housekeeping/tasks',
  '/rooms',
  '/reception',
  '/accounting',
  '/reports',
];

function cacheableGet(url) {
  if (url.pathname.startsWith('/_next/static/')) return true;
  if (url.pathname.endsWith('.css')) return true;
  if (url.pathname.endsWith('.js') && url.pathname.startsWith('/_next/')) return true;
  return SHELL.includes(url.pathname);
}

async function offlineFallback(request) {
  const cache = await caches.open(CACHE);
  const path = new URL(request.url).pathname;
  const cached =
    (await cache.match(request)) ??
    (await cache.match(path)) ??
    (await cache.match(OFFLINE_URL)) ??
    (await cache.match('/housekeeping/mobile')) ??
    (await cache.match('/'));
  return cached;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(SHELL.filter((p) => !p.startsWith('/api/'))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && cacheableGet(url)) {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => offlineFallback(event.request)),
    );
    return;
  }

  if (event.request.method === 'PATCH' && url.pathname === '/api/housekeeping/rooms') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const body = await event.request.clone().json().catch(() => null);
        if (body?.roomNo && body?.hkStatus) {
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clients) {
            client.postMessage({ type: 'roomio-hk-offline', payload: body });
          }
        }
        return new Response(JSON.stringify({ ok: true, queued: true, offline: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data?.json?.() ?? {};
  } catch {
    payload = {};
  }
  const title = payload.title ?? 'Roomio HK';
  const body = payload.body ?? 'Yeni görev veya oda durumu güncellemesi';
  const pushData = payload.data ?? { url: '/housekeeping/mobile' };
  const options = {
    body,
    tag: payload.tag ?? 'roomio-hk',
    renotify: true,
    data: pushData,
  };

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({
          type: 'roomio-hk-push',
          payload: {
            title,
            body,
            tag: options.tag,
            roomNo: pushData.roomNo,
            hkStatus: pushData.hkStatus,
          },
        });
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/housekeeping/mobile');
    }),
  );
});
