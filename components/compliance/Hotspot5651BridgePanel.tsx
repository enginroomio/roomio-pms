'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Play, Wifi } from 'lucide-react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { SAMPLE_SYSLOG_LINES } from '@/lib/integrations/hotspot5651/parsers';
import { SAMPLE_RADIUS_ACCOUNTING, freeradiusRestNotes } from '@/lib/integrations/hotspot5651/radius-webhook';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

type Props = {
  config: Hotspot5651Config;
  onChange: (config: Hotspot5651Config) => void;
  onSave: () => void;
  saved: boolean;
};

export function Hotspot5651BridgePanel({ config, onChange, onSave, saved }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [testLine, setTestLine] = useState(SAMPLE_SYSLOG_LINES.mikrotik_login);
  const [radiusJson, setRadiusJson] = useState(JSON.stringify(SAMPLE_RADIUS_ACCOUNTING.start, null, 2));

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ingestUrl = `${origin}/api/compliance/5651/ingest`;
  const radiusUrl = `${origin}/api/compliance/5651/radius/accounting`;
  const portalUrl = `${origin}${config.captivePortalUrl}`;

  async function testSyslog(dryRun: boolean) {
    const res = await roomioFetch('/api/compliance/5651/bridge/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: config.provider, line: testLine, dryRun }),
    });
    const j = await res.json();
    setMsg(dryRun ? `Syslog parse: ${JSON.stringify(j.parsed)}` : j.result?.message ?? j.message);
  }

  async function testRadius(dryRun: boolean) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(radiusJson) as Record<string, unknown>;
    } catch {
      setMsg('Geçersiz RADIUS JSON');
      return;
    }
    if (dryRun) {
      const res = await roomioFetch('/api/compliance/5651/bridge/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radius: payload, dryRun: true }),
      });
      const j = await res.json();
      setMsg(`RADIUS parse: ${JSON.stringify(j.parsed)}`);
      return;
    }
    const res = await fetch(radiusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Roomio-Bridge-Secret': config.bridgeSecret,
      },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    setMsg(j.result?.message ?? j.summary ?? JSON.stringify(j));
  }

  return (
    <div className="roomio-bridge-panel">
      <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
        <h2 className="roomio-card-title"><Wifi size={18} /> Misafir captive portal</h2>
        <p className="roomio-page-desc">
          5651 için misafir kimlik doğrulama zorunludur. Check-in şifresi ile giriş ekranı:
        </p>
        <div className="roomio-form-grid">
          <label className="roomio-field roomio-field--row">
            <input
              type="checkbox"
              checked={config.captivePortalEnabled}
              onChange={(e) => onChange({ ...config, captivePortalEnabled: e.target.checked })}
            />
            <span>Captive portal aktif</span>
          </label>
          <label className="roomio-field">
            <span>Portal URL (MikroTik login-url)</span>
            <input className="roomio-input" value={config.captivePortalUrl} onChange={(e) => onChange({ ...config, captivePortalUrl: e.target.value })} />
          </label>
          <label className="roomio-field">
            <span>Oda başına maksimum cihaz</span>
            <input
              className="roomio-input"
              type="number"
              min={1}
              max={20}
              value={config.maxDevicesPerUser}
              onChange={(e) => onChange({ ...config, maxDevicesPerUser: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
        </div>
        <p className="roomio-page-desc">
          <Link href={config.captivePortalUrl} target="_blank">Misafir login ekranını aç</Link>
          {' · '}
          <code>{portalUrl}?mac=AA:BB:CC:DD:EE:FF&amp;ip=10.10.50.1</code>
        </p>
        <p className="roomio-page-desc">
          1 oda/misafir bilgisiyle aynı anda en fazla <strong>{config.maxDevicesPerUser}</strong> cihaz bağlanabilir (telefon, tablet, bilgisayar vb.). Limit, MikroTik&apos;te <code>shared-users</code> ile eşleşir — Cihazlar sekmesindeki RouterOS şablonunu yeniden kopyalayıp çalıştırın.
        </p>
      </div>

      <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
        <h2 className="roomio-card-title">RADIUS Accounting Webhook</h2>
        <p className="roomio-page-desc">FreeRADIUS rest modülü veya MikroTik → Accounting-Start/Stop/Interim</p>
        <label className="roomio-field roomio-field--row">
          <input
            type="checkbox"
            checked={config.radiusWebhookEnabled}
            onChange={(e) => onChange({ ...config, radiusWebhookEnabled: e.target.checked })}
          />
          <span>RADIUS accounting webhook aktif</span>
        </label>
        <div className="roomio-card" style={{ marginTop: 12, padding: 12, background: 'var(--roomio-surface)' }}>
          <code style={{ display: 'block', fontSize: '0.8rem' }}>POST {radiusUrl}</code>
          <code style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>Header: X-Roomio-Bridge-Secret: {config.bridgeSecret}</code>
          <code style={{ display: 'block', marginTop: 4, fontSize: '0.75rem' }}>Content-Type: application/json | application/x-www-form-urlencoded</code>
        </div>
        <label className="roomio-field" style={{ marginTop: 12 }}>
          <span>Test RADIUS accounting JSON</span>
          <textarea className="roomio-input" rows={8} value={radiusJson} onChange={(e) => setRadiusJson(e.target.value)} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.75rem' }} />
        </label>
        <div className="roomio-form-actions">
          <Button variant="secondary" onClick={() => void testRadius(true)}>Parse test</Button>
          <Button onClick={() => void testRadius(false)}>Webhook gönder</Button>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => setRadiusJson(JSON.stringify(SAMPLE_RADIUS_ACCOUNTING.stop, null, 2))}>
            Stop örneği
          </button>
        </div>
        <pre className="roomio-code-block" style={{ marginTop: 12 }}>{freeradiusRestNotes()}</pre>
      </div>

      <div className="roomio-card roomio-form" style={{ marginTop: 16 }}>
        <h2 className="roomio-card-title">Syslog köprüsü</h2>
        <div className="roomio-form-grid">
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.bridgeEnabled} onChange={(e) => onChange({ ...config, bridgeEnabled: e.target.checked })} />
            <span>HTTP ingest aktif</span>
          </label>
          <label className="roomio-field">
            <span>Secret</span>
            <input className="roomio-input" value={config.bridgeSecret} onChange={(e) => onChange({ ...config, bridgeSecret: e.target.value })} />
          </label>
        </div>
        <code style={{ display: 'block', marginTop: 8, fontSize: '0.8rem' }}>POST {ingestUrl}</code>
        <p className="roomio-page-desc">UDP: <code>npm run bridge:syslog</code> → port 5514</p>
        <textarea className="roomio-input" rows={2} value={testLine} onChange={(e) => setTestLine(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
        <div className="roomio-form-actions">
          <Button variant="secondary" onClick={() => void testSyslog(true)}><Play size={14} /> Parse</Button>
          <Button onClick={() => void testSyslog(false)}>Kayda işle</Button>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => void navigator.clipboard.writeText(testLine)}><Copy size={14} /></button>
        </div>
        {msg ? <p className="roomio-page-desc">{msg}</p> : null}
      </div>

      <div className="roomio-form-actions" style={{ marginTop: 16 }}>
        <Button onClick={onSave}>Kaydet</Button>
      </div>
      {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
    </div>
  );
}
