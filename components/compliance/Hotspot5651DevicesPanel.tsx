'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, Router, Wifi } from 'lucide-react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { mikrotikRb5009SetupScript } from '@/lib/integrations/hotspot5651/mikrotik';
import { unifiSyslogInstructions } from '@/lib/integrations/hotspot5651/unifi';
import {
  MIKROTIK_MODELS,
  type Hotspot5651Config,
  type MikrotikDeviceConfig,
} from '@/lib/integrations/hotspot5651/types';

type DeviceStatus = {
  mikrotik: { ok: boolean; message: string; simulated?: boolean };
  unifi: { ok: boolean; message: string; simulated?: boolean };
  accessPoints: Array<{ name: string; mac: string; model: string; state: number }>;
  activeMikrotik: number;
  activeUnifi: number;
};

type Props = {
  config: Hotspot5651Config;
  onChange: (config: Hotspot5651Config) => void;
  onSave: () => void;
  saved: boolean;
};

function patchMikrotik(config: Hotspot5651Config, patch: Partial<MikrotikDeviceConfig>): Hotspot5651Config {
  return { ...config, mikrotik: { ...config.mikrotik, ...patch } };
}

export function Hotspot5651DevicesPanel({ config, onChange, onSave, saved }: Props) {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = useCallback(() => {
    void roomioFetch('/api/compliance/5651/devices')
      .then((r) => r.json())
      .then((j: DeviceStatus) => setStatus(j))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function testDevice(device: 'mikrotik' | 'unifi') {
    setBusy(true);
    const res = await roomioFetch('/api/compliance/5651/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', device }),
    });
    const j = await res.json();
    setMsg(j.results?.map((r: { message: string }) => r.message).join(' · ') ?? j.message);
    loadStatus();
    setBusy(false);
  }

  async function syncSessions() {
    setBusy(true);
    const res = await roomioFetch('/api/compliance/5651/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    });
    const j = await res.json();
    setMsg(`Senkron: MikroTik ${j.mikrotik} · UniFi ${j.unifi} · ${j.ingested} kayıt işlendi`);
    setBusy(false);
  }

  const rb5009Script =
    config.mikrotik.model === 'RB5009UG+S+IN'
      ? mikrotikRb5009SetupScript({
          roomioSyslogHost: config.syslogHost,
          roomioPortalHost: typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1',
          syslogPort: 5514,
          hotspotServer: config.mikrotik.hotspotServer,
          hotspotProfile: config.mikrotik.hotspotProfile,
          guestVlan: config.unifi.guestVlan,
        })
      : '';

  return (
    <div className="roomio-devices-panel">
      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">MikroTik</span>
          <strong className="roomio-kpi-value">{status?.mikrotik.ok ? 'Bağlı' : '—'}</strong>
          <span className="roomio-kpi-strip__hint">{status?.activeMikrotik ?? 0} aktif hotspot</span>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">UniFi AP</span>
          <strong className="roomio-kpi-value">{status?.accessPoints?.length ?? '—'}</strong>
          <span className="roomio-kpi-strip__hint">{status?.activeUnifi ?? 0} misafir istasyonu</span>
        </div>
      </div>

      {msg ? <p className="roomio-page-desc">{msg}</p> : null}

      <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title"><Router size={18} /> MikroTik — {config.mikrotik.model}</h2>
          <div className="roomio-quick-actions">
            <Button variant="secondary" disabled={busy} onClick={() => void testDevice('mikrotik')}>Bağlantı testi</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void syncSessions()}><RefreshCw size={14} /> Senkron</Button>
          </div>
        </div>
        <p className="roomio-page-desc">
          RB5009UG+S+IN: ether1 WAN, ether2-7 UniFi AP trunk, VLAN {config.unifi.guestVlan} misafir ağı, Hotspot + REST API (443).
        </p>
        <div className="roomio-form-grid">
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.mikrotik.enabled}
              onChange={(e) => onChange(patchMikrotik(config, { enabled: e.target.checked }))}
            />
            <span>MikroTik entegrasyonu aktif</span>
          </label>
          <label className="roomio-field">
            <span>Model</span>
            <select
              className="roomio-input"
              value={config.mikrotik.model}
              onChange={(e) => onChange(patchMikrotik(config, { model: e.target.value }))}
            >
              {MIKROTIK_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="roomio-field">
            <span>REST host</span>
            <input className="roomio-input" value={config.mikrotik.host} onChange={(e) => onChange(patchMikrotik(config, { host: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>Kullanıcı</span>
            <input className="roomio-input" value={config.mikrotik.username} onChange={(e) => onChange(patchMikrotik(config, { username: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>Şifre</span>
            <input className="roomio-input" type="password" value={config.mikrotik.password} onChange={(e) => onChange(patchMikrotik(config, { password: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>Hotspot server</span>
            <input className="roomio-input" value={config.mikrotik.hotspotServer} onChange={(e) => onChange(patchMikrotik(config, { hotspotServer: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>WAN arayüz</span>
            <input className="roomio-input" value={config.mikrotik.wanInterface} onChange={(e) => onChange(patchMikrotik(config, { wanInterface: e.target.value }))} />
          </label>
          <label className="roomio-field">
            <span>LAN bridge</span>
            <input className="roomio-input" value={config.mikrotik.lanBridge} onChange={(e) => onChange(patchMikrotik(config, { lanBridge: e.target.value }))} />
          </label>
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.mikrotik.simulateWhenOffline}
              onChange={(e) => onChange(patchMikrotik(config, { simulateWhenOffline: e.target.checked }))}
            />
            <span>Cihaz yoksa simülasyon (geliştirme)</span>
          </label>
        </div>
        {status?.mikrotik.message ? <p className="roomio-page-desc">Durum: {status.mikrotik.message}</p> : null}
        {rb5009Script ? (
          <div style={{ marginTop: 12 }}>
            <div className="roomio-kurulus-toolbar">
              <strong>RB5009 RouterOS şablonu</strong>
              <button
                type="button"
                className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                onClick={() => void navigator.clipboard.writeText(rb5009Script)}
              >
                <Copy size={14} /> Kopyala
              </button>
            </div>
            <textarea className="roomio-input" readOnly rows={10} value={rb5009Script} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.75rem' }} />
          </div>
        ) : null}
      </div>

      <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title"><Wifi size={18} /> UniFi Access Points</h2>
          <Button variant="secondary" disabled={busy} onClick={() => void testDevice('unifi')}>Controller testi</Button>
        </div>
        <div className="roomio-form-grid">
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.unifi.enabled}
              onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, enabled: e.target.checked } })}
            />
            <span>UniFi entegrasyonu aktif</span>
          </label>
          <label className="roomio-field">
            <span>Controller URL</span>
            <input className="roomio-input" value={config.unifi.controllerUrl} onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, controllerUrl: e.target.value } })} />
          </label>
          <label className="roomio-field">
            <span>Site ID</span>
            <input className="roomio-input" value={config.unifi.siteId} onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, siteId: e.target.value } })} />
          </label>
          <label className="roomio-field">
            <span>Misafir WLAN</span>
            <input className="roomio-input" value={config.unifi.guestWlan} onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, guestWlan: e.target.value } })} />
          </label>
          <label className="roomio-field">
            <span>Misafir VLAN</span>
            <input className="roomio-input" type="number" value={config.unifi.guestVlan} onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, guestVlan: Number(e.target.value) } })} />
          </label>
          <label className="roomio-field">
            <span>AP sayısı</span>
            <input className="roomio-input" type="number" value={config.unifi.apCount} onChange={(e) => onChange({ ...config, unifi: { ...config.unifi, apCount: Number(e.target.value) } })} />
          </label>
        </div>
        {status?.unifi.message ? <p className="roomio-page-desc">Durum: {status.unifi.message}</p> : null}
        {status?.accessPoints?.length ? (
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead><tr><th>AP</th><th>MAC</th><th>Model</th><th>Durum</th></tr></thead>
              <tbody>
                {status.accessPoints.map((ap) => (
                  <tr key={ap.mac}>
                    <td>{ap.name}</td>
                    <td><code>{ap.mac}</code></td>
                    <td>{ap.model}</td>
                    <td>{ap.state === 1 ? <span className="roomio-badge roomio-badge--accent">Online</span> : <span className="roomio-badge">Offline</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <pre className="roomio-code-block" style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: '0.78rem' }}>
          {unifiSyslogInstructions(config.syslogHost, 5514)}
        </pre>
      </div>

      <div className="roomio-form-actions" style={{ marginTop: 16 }}>
        <Button onClick={onSave}>Cihaz ayarlarını kaydet</Button>
      </div>
      {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
    </div>
  );
}
