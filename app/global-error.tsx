'use client';

/** Beklenmeyen istemci hatası — eski önbellek / chunk uyumsuzluğu sonrası kurtarma */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  async function hardReset() {
    try {
      localStorage.removeItem('roomio-token');
      localStorage.removeItem('roomio-demo-role');
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignore
    }
    window.location.href = '/login';
  }

  return (
    <html lang="tr">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 32, maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Uygulama yüklenemedi</h1>
        <p style={{ color: '#475569', lineHeight: 1.5 }}>
          Genelde eski tarayıcı önbelleği veya güncelleme sonrası uyumsuz dosyalardan kaynaklanır.
        </p>
        {error.message ? (
          <pre style={{ fontSize: 12, background: '#f1f5f9', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {error.message}
          </pre>
        ) : null}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{ padding: '10px 16px', cursor: 'pointer' }}
          >
            Tekrar dene
          </button>
          <button
            type="button"
            onClick={() => void hardReset()}
            style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}
          >
            Önbelleği temizle ve girişe git
          </button>
        </div>
      </body>
    </html>
  );
}
