'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { DeployCheck, ProductionReadiness } from '@/lib/deploy/types';

function statusIcon(c: DeployCheck): string {
  if (!c.ok) return '✗';
  if (c.warn) return '⚠';
  return '✓';
}

function categoryLabel(cat: DeployCheck['category']): string {
  if (cat === 'infra') return 'Altyapı';
  if (cat === 'security') return 'Güvenlik';
  return 'Profesyonel modüller';
}

export function ProductionDeployHub() {
  const [readiness, setReadiness] = useState<ProductionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/deploy/readiness', { cache: 'no-store' });
      if (!res.ok) {
        setError('Hazırlık raporu alınamadı');
        return;
      }
      const body = (await res.json()) as ProductionReadiness;
      setReadiness(body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !readiness) {
    return <p className="roomio-page-desc" style={{ padding: 24 }}>Production hazırlık kontrolü yükleniyor…</p>;
  }

  const summary = readiness?.summary;

  return (
    <>
      <div className="roomio-kpi-grid">
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Geçen</span>
          <strong>{summary?.passed ?? '—'}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Uyarı</span>
          <strong>{summary?.warned ?? '—'}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Başarısız</span>
          <strong>{summary?.failed ?? '—'}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Durum</span>
          <strong>{readiness?.ok ? 'Hazır' : 'Eksik var'}</strong>
        </div>
      </div>

      {readiness?.release?.version ? (
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Sürüm {readiness.release.version}
          {readiness.release.builtAt ? ` · build ${readiness.release.builtAt.slice(0, 10)}` : ''}
          {readiness.release.gitSha ? ` · ${readiness.release.gitSha.slice(0, 7)}` : ''}
        </p>
      ) : null}

      {error ? <p className="roomio-page-desc roomio-text-warn" role="alert">{error}</p> : null}

      <div className="roomio-form-actions" style={{ margin: '16px 0' }}>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? 'Kontrol ediliyor…' : 'Yeniden kontrol et'}
        </Button>
      </div>

      {(['infra', 'security', 'module'] as const).map((cat) => {
        const items = readiness?.checks.filter((c) => c.category === cat) ?? [];
        if (!items.length) return null;
        return (
          <section key={cat} className="roomio-panel" style={{ marginBottom: 16 }}>
            <h2 className="roomio-panel__title">{categoryLabel(cat)}</h2>
            <div className="roomio-table-wrap">
              <table className="roomio-table roomio-table--compact">
                <thead>
                  <tr><th />
<th>Kontrol</th><th>Detay</th></tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td>{statusIcon(c)}</td>
                      <td><strong>{c.label}</strong></td>
                      <td className="roomio-muted">{c.detail ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="roomio-panel" style={{ marginBottom: 16 }}>
        <h2 className="roomio-panel__title">HK mobil push (saha)</h2>
        <p className="roomio-page-desc">
          VAPID anahtarları: <code>npm run vapid:gen</code> → Fly/Render secret olarak ekleyin.
          Saha testi: <Link href="/housekeeping/mobile">Mobil HK</Link>
          {' · '}
          <Link href="/housekeeping/assign">Oda atama</Link>
        </p>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Canlı doğrulama: <code>ROOMIO_PUBLIC_URL=https://pms.example.com npm run go-live:verify</code>
        </p>
      </section>

      <section className="roomio-panel">
        <h2 className="roomio-panel__title">Canlıya alma komutları</h2>
        <pre className="roomio-code-block" style={{ fontSize: 13, overflow: 'auto' }}>
{`npm run verify:pipeline          # tam doğrulama
npm run deploy:checklist         # statik + API kontrol listesi
ROOMIO_PUBLIC_URL=https://pms.example.com npm run deploy:checklist

# Docker
docker compose -f docker-compose.prod.yml up -d

# Fly.io / Render
npm run deploy:fly:live
npm run deploy:render`}
        </pre>
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Ayrıntılı liste: <code>references/PRODUCTION-DEPLOY-CHECKLIST.md</code>.
          Profesyonel modüller:{' '}
          <Link href="/settings/integrations/channel-manager">Kanal</Link>
          {' · '}
          <Link href="/revenue">RMS</Link>
          {' · '}
          <Link href="/loyalty">Sadakat</Link>
          {' · '}
          <Link href="/groups">Grup & Blok</Link>
        </p>
      </section>
    </>
  );
}
