'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

type SlaPayload = {
  ok: boolean;
  mode: string;
  sla: {
    uptimeLabel: string;
    healthOk: boolean;
    databaseOk: boolean;
    redisOk: boolean;
    pushReady: boolean;
    sentryConfigured: boolean;
    targetUptimePct: number;
    currentUptimePct: number;
  };
  properties: { count: number; cities: string[] };
  egm: { ok: boolean; simulated: boolean; message: string };
  release: { version?: string; build?: string | null };
};

export default function SlaDashboardPage() {
  const [data, setData] = useState<SlaPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/monitoring/sla')
      .then((r) => r.json())
      .then((j: SlaPayload) => setData(j))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageHeader
      breadcrumb="Araçlar > SLA"
      title="Production SLA"
      description="Uptime, health, çoklu tesis, EGM/KBS ve monitoring durumu."
      actions={<Button variant="secondary" href="/tools/rollout">← Rollout</Button>}
    >
      {loading ? <p className="roomio-page-desc">Yükleniyor…</p> : null}
      {data ? (
        <div className="roomio-detail-grid">
          <div className="roomio-card">
            <h2 className="roomio-card-title">SLA Özet</h2>
            <dl className="roomio-dl">
              <dt>Mod</dt><dd>{data.mode}</dd>
              <dt>Uptime</dt><dd>{data.sla.uptimeLabel}</dd>
              <dt>Hedef SLA</dt><dd>%{data.sla.targetUptimePct}</dd>
              <dt>Health</dt><dd>{data.sla.healthOk ? 'OK' : 'Hata'}</dd>
              <dt>Veritabanı</dt><dd>{data.sla.databaseOk ? 'OK' : 'Hata'}</dd>
              <dt>Push</dt><dd>{data.sla.pushReady ? 'Hazır' : 'Kapalı'}</dd>
              <dt>Sentry</dt><dd>{data.sla.sentryConfigured ? 'Yapılandırılmış' : 'Kapalı'}</dd>
            </dl>
          </div>
          <div className="roomio-card">
            <h2 className="roomio-card-title">Çoklu Tesis</h2>
            <dl className="roomio-dl">
              <dt>Tesis sayısı</dt><dd>{data.properties.count}</dd>
              <dt>Şehirler</dt><dd>{data.properties.cities.join(', ') || '—'}</dd>
            </dl>
          </div>
          <div className="roomio-card">
            <h2 className="roomio-card-title">EGM / KBS</h2>
            <p className="roomio-page-desc">{data.egm.message}{data.egm.simulated ? ' (simülasyon)' : ''}</p>
          </div>
          <div className="roomio-card">
            <h2 className="roomio-card-title">Release</h2>
            <dl className="roomio-dl">
              <dt>Sürüm</dt><dd>{data.release.version ?? '—'}</dd>
              <dt>Build</dt><dd>{data.release.build ?? '—'}</dd>
            </dl>
          </div>
        </div>
      ) : null}
    </PageHeader>
  );
}
