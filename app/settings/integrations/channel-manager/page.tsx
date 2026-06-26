'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe2, RefreshCw } from 'lucide-react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  CHANNEL_CATALOG,
  DEFAULT_CHANNEL_MANAGER_CONFIG,
  type ChannelManagerConfig,
  type ChannelSyncLogEntry,
  type ChannelSyncResult,
} from '@/lib/integrations/channel-manager/types';

function statusClass(status?: string): string {
  if (status === 'connected') return 'roomio-pill roomio-pill--ok';
  if (status === 'error') return 'roomio-pill roomio-pill--danger';
  if (status === 'pending') return 'roomio-pill roomio-pill--warn';
  return 'roomio-pill';
}

export default function ChannelManagerPage() {
  const [config, setConfig] = useState<ChannelManagerConfig>(DEFAULT_CHANNEL_MANAGER_CONFIG);
  const [saved, setSaved] = useState(false);
  const [syncResult, setSyncResult] = useState<ChannelSyncResult | null>(null);
  const [logs, setLogs] = useState<ChannelSyncLogEntry[]>([]);
  const [busy, setBusy] = useState(false);

  const catalogById = useMemo(() => new Map(CHANNEL_CATALOG.map((c) => [c.id, c])), []);

  useEffect(() => {
    void roomioFetch('/api/integrations/channel-manager/config')
      .then((r) => r.json())
      .then((j: ChannelManagerConfig) => setConfig({ ...DEFAULT_CHANNEL_MANAGER_CONFIG, ...j }));
    void roomioFetch('/api/integrations/channel-manager/logs?limit=8')
      .then((r) => r.json())
      .then((j: { logs?: ChannelSyncLogEntry[] }) => setLogs(j.logs ?? []));
  }, []);

  function updateChannel(channelId: string, patch: Partial<ChannelManagerConfig['channels'][number]>) {
    setConfig((prev) => ({
      ...prev,
      channels: prev.channels.map((c) => (c.channelId === channelId ? { ...c, ...patch } : c)),
    }));
  }

  async function save() {
    await roomioFetch('/api/integrations/channel-manager/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function runSync(testOnly = false) {
    setBusy(true);
    setSyncResult(null);
    try {
      const res = await roomioFetch(`/api/integrations/channel-manager/sync${testOnly ? '?test=1' : ''}`, {
        method: 'POST',
      });
      const j = (await res.json()) as ChannelSyncResult;
      setSyncResult(j);
      if (!testOnly) {
        const cfgRes = await roomioFetch('/api/integrations/channel-manager/config');
        const cfg = (await cfgRes.json()) as ChannelManagerConfig;
        setConfig({ ...DEFAULT_CHANNEL_MANAGER_CONFIG, ...cfg });
        const logRes = await roomioFetch('/api/integrations/channel-manager/logs?limit=8');
        const logJ = (await logRes.json()) as { logs?: ChannelSyncLogEntry[] };
        setLogs(logJ.logs ?? []);
      }
    } finally {
      setBusy(false);
    }
  }

  const enabledCount = config.channels.filter((c) => c.enabled).length;

  return (
    <IntegrationPageLayout
      segment={"Kanal Yöneticisi"}
      title={"Kanal Yöneticisi"}
      description={"ElektraWeb / Barboon uyumlu iki yönlü kanal senkronu — Booking, Expedia, fiyat, müsaitlik ve rezervasyon aktarımı."}
      >
      <FormSection title="Genel">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            <span>Kanal yöneticisi aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.simulateWhenOffline}
              onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })}
            />
            <span>Canlı API yoksa simülasyon (geliştirme)</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.autoConfirmReservations}
              onChange={(e) => setConfig({ ...config, autoConfirmReservations: e.target.checked })}
            />
            <span>Gelen rezervasyonları otomatik onayla</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.compareOfflineRates}
              onChange={(e) => setConfig({ ...config, compareOfflineRates: e.target.checked })}
            />
            <span>Offline kanal fiyatlarını karşılaştır</span>
          </label>
          <FormField label="Senkron aralığı (dakika)">
            <Input
              type="number"
              min={5}
              value={config.syncIntervalMinutes}
              onChange={(e) => setConfig({ ...config, syncIntervalMinutes: Number(e.target.value) })}
            />
          </FormField>
        </FormGrid>
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          <Globe2 size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {enabledCount} kanal etkin — canlı mod için <code>ROOMIO_INTEGRATION_LIVE=1</code> ve{' '}
          <code>ROOMIO_CHANNEL_GATEWAY_URL</code> veya kanal API anahtarları.
        </p>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" disabled={busy} onClick={() => void runSync(true)}>Bağlantı Testi</Button>
          <Button variant="secondary" disabled={busy} onClick={() => void runSync(false)}>
            <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Senkron Et
          </Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {syncResult ? (
          <p className="roomio-page-desc">
            {syncResult.message}
            {syncResult.simulated ? ' (simülasyon)' : syncResult.liveMode ? ' (canlı)' : ''}
            {syncResult.ok ? ` — ${syncResult.pushedRates} fiyat, ${syncResult.pushedAvailability} müsaitlik, ${syncResult.pulledReservations} çekilen, ${syncResult.importedReservations ?? 0} içe aktarılan` : ''}
          </p>
        ) : null}
      </FormSection>

      <FormSection title="Kanal Bağlantıları" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Aktif</th>
                <th>Kanal</th>
                <th>Tür</th>
                <th>Property ID</th>
                <th>API Key</th>
                <th>Fiyat</th>
                <th>Müsaitlik</th>
                <th>Rezervasyon</th>
                <th>Son senkron</th>
              </tr>
            </thead>
            <tbody>
              {config.channels.map((ch) => {
                const meta = catalogById.get(ch.channelId);
                return (
                  <tr key={ch.channelId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={ch.enabled}
                        onChange={(e) => updateChannel(ch.channelId, { enabled: e.target.checked })}
                      />
                    </td>
                    <td><strong>{meta?.name ?? ch.channelId}</strong></td>
                    <td>{meta?.type ?? '—'}</td>
                    <td>
                      <Input
                        value={ch.propertyId}
                        placeholder="Otel ID"
                        onChange={(e) => updateChannel(ch.channelId, { propertyId: e.target.value })}
                      />
                    </td>
                    <td>
                      <Input
                        type="password"
                        value={ch.apiKey}
                        placeholder="API / token"
                        onChange={(e) => updateChannel(ch.channelId, { apiKey: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={ch.pushRates}
                        onChange={(e) => updateChannel(ch.channelId, { pushRates: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={ch.pushAvailability}
                        onChange={(e) => updateChannel(ch.channelId, { pushAvailability: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={ch.pullReservations}
                        onChange={(e) => updateChannel(ch.channelId, { pullReservations: e.target.checked })}
                      />
                    </td>
                    <td>
                      {ch.lastSyncAt ? (
                        <span title={ch.lastSyncMessage}>
                          <span className={statusClass(ch.lastSyncStatus)}>
                            {ch.lastSyncStatus ?? '—'}
                          </span>
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>

      <FormSection title="Senkron Geçmişi" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Durum</th>
                <th>Mod</th>
                <th>Fiyat</th>
                <th>Müsaitlik</th>
                <th>Rezervasyon</th>
                <th>Mesaj</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7}>Henüz senkron kaydı yok.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.at).toLocaleString('tr-TR')}</td>
                    <td><span className={statusClass(log.ok ? 'connected' : 'error')}>{log.ok ? 'OK' : 'Hata'}</span></td>
                    <td>{log.simulated ? 'Simülasyon' : log.liveMode ? 'Canlı' : '—'}</td>
                    <td>{log.pushedRates}</td>
                    <td>{log.pushedAvailability}</td>
                    <td>{log.importedReservations}/{log.pulledReservations}</td>
                    <td>{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FormSection>

      <FormSection title="Sanal Oda Tipi Eşlemesi" className="roomio-form-section--spaced">
        <p className="roomio-page-desc">
          ElektraWeb&apos;deki gibi sanal oda tipleri ile PMS oda tiplerini eşleyin; kanal bazlı kontenjan formülü tanımlayabilirsiniz.
        </p>
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead>
              <tr>
                <th>PMS tip</th>
                <th>Sanal kanal tipi</th>
                <th>Formül (opsiyonel)</th>
              </tr>
            </thead>
            <tbody>
              {config.virtualRoomMappings.map((m, i) => (
                <tr key={`${m.pmsRoomTypeId}-${i}`}>
                  <td>{m.pmsRoomTypeName} ({m.pmsRoomTypeId})</td>
                  <td>{m.channelRoomTypeName} ({m.channelRoomTypeId})</td>
                  <td>{m.allotmentFormula ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
