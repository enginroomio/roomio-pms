'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Download, Plus, Shield, Wifi } from 'lucide-react';
import { Hotspot5651BridgePanel } from '@/components/compliance/Hotspot5651BridgePanel';
import { Hotspot5651DevicesPanel } from '@/components/compliance/Hotspot5651DevicesPanel';
import { Hotspot5651AutomationPanel } from '@/components/compliance/Hotspot5651AutomationPanel';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_HOTSPOT_5651_CONFIG,
  type Hotspot5651Config,
  type HotspotSessionLog,
} from '@/lib/integrations/hotspot5651/types';

type Tab = 'overview' | 'devices' | 'bridge' | 'logs' | 'config';

type Stats = {
  totalSessions: number;
  activeSessions: number;
  retentionDays: number;
  lastExport: string | null;
  compliantRate: number;
};

function mergeConfig(raw: Partial<Hotspot5651Config>): Hotspot5651Config {
  return {
    ...DEFAULT_HOTSPOT_5651_CONFIG,
    ...raw,
    mikrotik: { ...DEFAULT_HOTSPOT_5651_CONFIG.mikrotik, ...raw.mikrotik },
    unifi: { ...DEFAULT_HOTSPOT_5651_CONFIG.unifi, ...raw.unifi },
  };
}

function formatBytes(n: number): string {
  if (n < 1_000_000) return `${(n / 1000).toFixed(0)} KB`;
  return `${(n / 1_000_000).toFixed(1)} MB`;
}

function Hotspot5651PageInner() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>('overview');
  const [config, setConfig] = useState<Hotspot5651Config>(DEFAULT_HOTSPOT_5651_CONFIG);
  const [logs, setLogs] = useState<HotspotSessionLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (urlTab === 'devices' || urlTab === 'logs' || urlTab === 'bridge' || urlTab === 'config' || urlTab === 'overview') {
      setTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    void Promise.all([
      roomioFetch('/api/compliance/5651/config').then((r) => r.json()),
      roomioFetch('/api/compliance/5651/logs').then((r) => r.json()),
      roomioFetch('/api/compliance/5651/stats').then((r) => r.json()),
    ]).then(([cfg, logRes, st]) => {
      setConfig(mergeConfig(cfg));
      setLogs(logRes.logs ?? []);
      setStats(st);
    });
  }, []);

  async function saveConfig() {
    await roomioFetch('/api/compliance/5651/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function exportBtk() {
    const from = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const to = new Date().toISOString();
    const res = await roomioFetch(
      `/api/compliance/5651/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=csv`,
    );
    if (!res.ok) {
      setMsg('BTK dışa aktarım başarısız.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `btk-5651-${to.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('BTK uyumlu CSV dışa aktarıldı.');
  }

  async function addManualLog() {
    const res = await roomioFetch('/api/compliance/5651/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log: {
          startedAt: new Date().toISOString(),
          endedAt: null,
          internalIp: '10.10.50.50',
          internalPort: 52000,
          externalIp: '85.34.12.44',
          externalPort: 45001,
          macAddress: '00:11:22:33:44:55',
          bytesIn: 0,
          bytesOut: 0,
          guestName: 'Misafir (manuel)',
          guestIdType: 'room_guest',
          guestIdRaw: 'manual',
          roomNo: null,
          reservationId: null,
          authUser: null,
          source: 'manual',
          userAgent: null,
          hotspotZone: 'Lobby',
        },
      }),
    });
    const j = await res.json();
    if (j.log) {
      setLogs((prev) => [j.log, ...prev]);
      setMsg('Manuel oturum kaydı eklendi.');
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Özet' },
    { id: 'devices', label: 'MikroTik & UniFi' },
    { id: 'bridge', label: 'Syslog Köprü' },
    { id: 'logs', label: 'Oturum Kayıtları' },
    { id: 'config', label: 'Genel' },
  ];

  return (
    <ModuleLayout
      breadcrumb="Sistem › Uyumluluk › 5651 Hotspot"
      title="5651 Hotspot Loglama"
      description={`MikroTik ${config.mikrotik.model} + UniFi AP — 5651/BTK uyumlu misafir WiFi loglama.`}
      sideTitle="Uyumluluk"
      menuSearch=""
      actions={
        <div className="roomio-quick-actions">
          <Button variant="ghost" href="/settings/integrations">Entegrasyonlar</Button>
          <Button variant="ghost" href="/settings/integrations/tesa">TESA</Button>
        </div>
      }
    >
      <div className="roomio-tabs">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === 'overview' ? '/settings/compliance/5651' : `/settings/compliance/5651?tab=${t.id}`}
            className={`roomio-tab${tab === t.id ? ' is-active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="roomio-5651-overview">
          <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
            <div className="roomio-kpi">
              <span className="roomio-kpi-label">Toplam oturum</span>
              <strong className="roomio-kpi-value">{stats?.totalSessions ?? '—'}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi-label">Aktif oturum</span>
              <strong className="roomio-kpi-value">{stats?.activeSessions ?? '—'}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi-label">BTK uyum</span>
              <strong className="roomio-kpi-value">%{stats?.compliantRate ?? '—'}</strong>
            </div>
            <div className="roomio-kpi">
              <span className="roomio-kpi-label">Gateway</span>
              <strong className="roomio-kpi-value" style={{ fontSize: '0.85rem' }}>{config.mikrotik.model}</strong>
            </div>
          </div>

          <div className="roomio-card" style={{ marginTop: 16 }}>
            <h2 className="roomio-card-title"><Shield size={18} /> 5651 &amp; BTK</h2>
            <ul className="roomio-compliance-list">
              <li>MikroTik RB5009UG+S+IN — hotspot, NAT, syslog → Roomio</li>
              <li>UniFi Access Points — misafir WLAN VLAN {config.unifi.guestVlan}, controller senkron</li>
              <li>Check-in: oda kullanıcı adı (room412) MikroTik hotspot&apos;a yazılır</li>
              <li>Check-out: oturum kapatma + TESA kart iptali</li>
              <li>BTK CSV dışa aktarım — min. 1 yıl saklama</li>
            </ul>
            <div className="roomio-form-actions" style={{ marginTop: 16 }}>
              <Button onClick={() => void exportBtk()}><Download size={14} /> BTK CSV</Button>
              <Button variant="secondary" onClick={() => setTab('devices')}>Cihazlar</Button>
              <Button variant="secondary" onClick={() => setTab('logs')}>Kayıtlar</Button>
            </div>
            {msg ? <p className="roomio-page-desc">{msg}</p> : null}
          </div>

          <Hotspot5651AutomationPanel
            config={config}
            onChange={setConfig}
            onSave={() => void saveConfig()}
            saved={saved}
          />
        </div>
      ) : null}

      {tab === 'devices' ? (
        <Hotspot5651DevicesPanel config={config} onChange={setConfig} onSave={() => void saveConfig()} saved={saved} />
      ) : null}

      {tab === 'bridge' ? (
        <Hotspot5651BridgePanel config={config} onChange={setConfig} onSave={() => void saveConfig()} saved={saved} />
      ) : null}

      {tab === 'logs' ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <div className="roomio-kurulus-toolbar">
            <h2 className="roomio-card-title"><Wifi size={18} /> Oturum kayıtları</h2>
            <Button variant="secondary" onClick={() => void addManualLog()}><Plus size={14} /> Manuel</Button>
          </div>
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr>
                  <th>Başlangıç</th>
                  <th>Misafir / Oda</th>
                  <th>İç IP</th>
                  <th>MAC</th>
                  <th>Veri</th>
                  <th>Kaynak</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.startedAt).toLocaleString('tr-TR')}</td>
                    <td>{log.guestName}{log.roomNo ? ` · ${log.roomNo}` : ''}{log.provisioned ? ' · prov' : ''}</td>
                    <td>{log.internalIp}</td>
                    <td><code>{log.macAddress}</code></td>
                    <td>↓{formatBytes(log.bytesIn)} ↑{formatBytes(log.bytesOut)}</td>
                    <td>{log.source}</td>
                    <td>
                      {log.endedAt ? (
                        <span className="roomio-badge">Kapalı</span>
                      ) : (
                        <span className="roomio-badge roomio-badge--accent">Aktif</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'config' ? (
        <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Genel yapılandırma</h2>
          <div className="roomio-form-grid">
            <label className="roomio-field roomio-field--row">
              <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
              <span>5651 loglama aktif</span>
            </label>
            <label className="roomio-field">
              <span>Tesis adı</span>
              <input className="roomio-input" value={config.facilityName} onChange={(e) => setConfig({ ...config, facilityName: e.target.value })} />
            </label>
            <label className="roomio-field">
              <span>BTK kayıt no</span>
              <input className="roomio-input" value={config.btkRegistrationNo} onChange={(e) => setConfig({ ...config, btkRegistrationNo: e.target.value })} />
            </label>
            <label className="roomio-field">
              <span>Saklama (gün)</span>
              <input className="roomio-input" type="number" min={365} value={config.retentionDays} onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) })} />
            </label>
            <label className="roomio-field roomio-field--row">
              <input type="checkbox" checked={config.autoOpenOnCheckIn} onChange={(e) => setConfig({ ...config, autoOpenOnCheckIn: e.target.checked })} />
              <span>Check-in&apos;de WiFi provizyonu</span>
            </label>
            <label className="roomio-field roomio-field--row">
              <input type="checkbox" checked={config.autoCloseOnCheckOut} onChange={(e) => setConfig({ ...config, autoCloseOnCheckOut: e.target.checked })} />
              <span>Check-out&apos;ta WiFi kapat</span>
            </label>
            <label className="roomio-field roomio-field--row">
              <input type="checkbox" checked={config.linkToPmsGuest} onChange={(e) => setConfig({ ...config, linkToPmsGuest: e.target.checked })} />
              <span>PMS oda/misafir eşleştirme</span>
            </label>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button onClick={() => void saveConfig()}>Kaydet</Button>
          </div>
          {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        </div>
      ) : null}

      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        <Link href="/settings/integrations/tesa">TESA</Link> · <Link href="/settings/privacy">KVKK</Link>
      </p>
    </ModuleLayout>
  );
}

export default function Hotspot5651Page() {
  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <Hotspot5651PageInner />
    </Suspense>
  );
}
