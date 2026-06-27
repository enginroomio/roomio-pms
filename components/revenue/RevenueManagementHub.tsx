'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { DynamicPricingApplyResult } from '@/lib/dynamic-pricing/types';
import type { RevenueForecastSnapshot } from '@/lib/revenue-management/types';
import type { RevenueManagementConfig } from '@/lib/revenue-management/config';
import { DEFAULT_CHANNEL_STRATEGIES, DEFAULT_COMPETITOR_BENCHMARK } from '@/lib/revenue-management/types';

const DEFAULT_REVENUE_MANAGEMENT_CONFIG: RevenueManagementConfig = {
  channelStrategies: DEFAULT_CHANNEL_STRATEGIES,
  competitor: DEFAULT_COMPETITOR_BENCHMARK,
};

function money(n: number, currency: string): string {
  return `${n.toLocaleString('tr-TR')} ${currency}`;
}

export function RevenueManagementHub() {
  const [forecast, setForecast] = useState<RevenueForecastSnapshot | null>(null);
  const [rmsConfig, setRmsConfig] = useState<RevenueManagementConfig>(DEFAULT_REVENUE_MANAGEMENT_CONFIG);
  const [applyResult, setApplyResult] = useState<DynamicPricingApplyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fcRes, cfgRes] = await Promise.all([
        roomioFetch('/api/revenue-management/forecast?days=14'),
        roomioFetch('/api/revenue-management/config'),
      ]);
      setForecast((await fcRes.json()) as RevenueForecastSnapshot);
      setRmsConfig({ ...DEFAULT_REVENUE_MANAGEMENT_CONFIG, ...(await cfgRes.json()) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStrategies() {
    await roomioFetch('/api/revenue-management/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rmsConfig),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
  }

  async function applyPricing() {
    setBusy(true);
    setApplyResult(null);
    try {
      const res = await roomioFetch('/api/integrations/dynamic-pricing/apply', { method: 'POST' });
      setApplyResult((await res.json()) as DynamicPricingApplyResult);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading || !forecast) {
    return <p className="roomio-page-desc" style={{ padding: 24 }}>Gelir yönetimi yükleniyor…</p>;
  }

  return (
    <>
      <div className="roomio-kpi-strip">
        <div className="roomio-kpi">
          <span className="roomio-kpi__label">Ort. doluluk (14g)</span>
          <strong>{forecast.summary.avgOccupancy}%</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi__label">Tahmini gelir</span>
          <strong>{money(forecast.summary.totalForecastRevenue, forecast.currency)}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi__label">ADR</span>
          <strong>{money(forecast.summary.avgAdr, forecast.currency)}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi__label">RevPAR</span>
          <strong>{money(forecast.summary.avgRevpar, forecast.currency)}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi__label">Rakip endeksi</span>
          <strong>{forecast.competitor.marketIndex}</strong>
        </div>
      </div>

      {forecast.recommendedActions.length > 0 ? (
        <div className="roomio-card" style={{ padding: 16, marginBottom: 16 }}>
          <h2 className="roomio-card-title">Önerilen aksiyonlar</h2>
          <ul className="roomio-list">
            {forecast.recommendedActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="roomio-card roomio-table-wrap" style={{ marginBottom: 16 }}>
        <h2 className="roomio-card-title" style={{ padding: '12px 16px 0' }}>14 Günlük Gelir Tahmini</h2>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Doluluk</th>
              <th>Satılan</th>
              <th>Boş</th>
              <th>Rez. geliri</th>
              <th>Tahmin</th>
              <th>ADR</th>
              <th>RevPAR</th>
              <th>BAR</th>
            </tr>
          </thead>
          <tbody>
            {forecast.days.map((d) => (
              <tr key={d.date}>
                <td><strong>{d.date}</strong></td>
                <td>{d.occupancyPct}%</td>
                <td>{d.roomsSold}</td>
                <td>{d.roomsAvailable}</td>
                <td>{money(d.bookedRevenue, d.currency)}</td>
                <td>{money(d.forecastRevenue, d.currency)}</td>
                <td>{money(d.adr, d.currency)}</td>
                <td>{money(d.revpar, d.currency)}</td>
                <td>{money(d.suggestedRate, d.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="roomio-stack" style={{ gap: 16 }}>
        <div className="roomio-card roomio-table-wrap">
          <h2 className="roomio-card-title" style={{ padding: '12px 16px 0' }}>Kanal Gelir Dağılımı</h2>
          <table className="roomio-table">
            <thead>
              <tr><th>Kanal</th><th>Oda-gece</th><th>Gelir</th><th>Pay</th></tr>
            </thead>
            <tbody>
              {forecast.channelMix.length === 0 ? (
                <tr><td colSpan={4}>Henüz kanal verisi yok.</td></tr>
              ) : (
                forecast.channelMix.map((c) => (
                  <tr key={c.channelId}>
                    <td><strong>{c.channel}</strong></td>
                    <td>{c.rooms}</td>
                    <td>{money(c.revenue, forecast.currency)}</td>
                    <td>{c.sharePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="roomio-card" style={{ padding: 16 }}>
          <h2 className="roomio-card-title">Kanal Fiyat Stratejisi</h2>
          <p className="roomio-page-desc">
            Opera / Elektra RMS — BAR fiyatına kanal bazlı markup. Booking genelde +%8–15, direkt satış indirimli.
          </p>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead>
                <tr><th>Aktif</th><th>Kanal</th><th>Markup %</th><th>Min</th><th>Max</th></tr>
              </thead>
              <tbody>
                {rmsConfig.channelStrategies.map((s, i) => (
                  <tr key={s.channelId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) => {
                          const channelStrategies = [...rmsConfig.channelStrategies];
                          channelStrategies[i] = { ...s, enabled: e.target.checked };
                          setRmsConfig({ ...rmsConfig, channelStrategies });
                        }}
                      />
                    </td>
                    <td>{s.channelName}</td>
                    <td>
                      <input
                        className="roomio-input"
                        type="number"
                        style={{ width: 72 }}
                        value={s.markupPercent}
                        onChange={(e) => {
                          const channelStrategies = [...rmsConfig.channelStrategies];
                          channelStrategies[i] = { ...s, markupPercent: Number(e.target.value) };
                          setRmsConfig({ ...rmsConfig, channelStrategies });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="roomio-input"
                        type="number"
                        style={{ width: 80 }}
                        value={s.minRate ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const channelStrategies = [...rmsConfig.channelStrategies];
                          channelStrategies[i] = {
                            ...s,
                            minRate: e.target.value ? Number(e.target.value) : undefined,
                          };
                          setRmsConfig({ ...rmsConfig, channelStrategies });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="roomio-input"
                        type="number"
                        style={{ width: 80 }}
                        value={s.maxRate ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const channelStrategies = [...rmsConfig.channelStrategies];
                          channelStrategies[i] = {
                            ...s,
                            maxRate: e.target.value ? Number(e.target.value) : undefined,
                          };
                          setRmsConfig({ ...rmsConfig, channelStrategies });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="roomio-form-grid" style={{ marginTop: 16 }}>
            <label className="roomio-field roomio-field--row">
              <input
                type="checkbox"
                checked={rmsConfig.competitor.enabled}
                onChange={(e) => setRmsConfig({
                  ...rmsConfig,
                  competitor: { ...rmsConfig.competitor, enabled: e.target.checked },
                })}
              />
              <span>Rakip endeks kuralı aktif</span>
            </label>
            <label className="roomio-field">
              <span>Pazar endeksi (0–100)</span>
              <input
                className="roomio-input"
                type="number"
                min={0}
                max={100}
                value={rmsConfig.competitor.marketIndex}
                onChange={(e) => setRmsConfig({
                  ...rmsConfig,
                  competitor: { ...rmsConfig.competitor, marketIndex: Number(e.target.value) },
                })}
              />
            </label>
            <label className="roomio-field">
              <span>Her 10 puan için % ayar</span>
              <input
                className="roomio-input"
                type="number"
                value={rmsConfig.competitor.adjustmentPer10Points}
                onChange={(e) => setRmsConfig({
                  ...rmsConfig,
                  competitor: { ...rmsConfig.competitor, adjustmentPer10Points: Number(e.target.value) },
                })}
              />
            </label>
          </div>

          <div className="roomio-form-actions" style={{ marginTop: 12 }}>
            <Button onClick={() => void saveStrategies()}>Stratejileri Kaydet</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void applyPricing()}>
              Fiyat Kurallarını Uygula
            </Button>
            <Button variant="ghost" href="/settings/integrations/dynamic-pricing">Kural editörü</Button>
            <Button variant="ghost" href="/settings/integrations/channel-manager">Kanal yöneticisi</Button>
          </div>
          {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
          {applyResult ? <p className="roomio-page-desc">{applyResult.message}</p> : null}
        </div>
      </div>

      <p className="roomio-page-desc" style={{ marginTop: 12 }}>
        İş günü: {forecast.businessDate} · <Link href="/reservations/calendar" className="roomio-link">Forecast (F1)</Link>
      </p>
    </>
  );
}
