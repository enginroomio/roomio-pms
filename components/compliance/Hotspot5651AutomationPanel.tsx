'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Hotspot5651Config } from '@/lib/integrations/hotspot5651/types';

type AutomationStatus = {
  enabled: boolean;
  intervalMinutes: number;
  lastRun: string | null;
  autoSyncDevices: boolean;
  autoProvisionInHouse: boolean;
  autoTesaOnCheckIn: boolean;
  autoCloseOnCheckOut: boolean;
};

type RunResult = {
  at: string;
  provisioned: number;
  closed: number;
  synced: { ingested: number; mikrotik: number; unifi: number };
  departuresProcessed: number;
  errors: string[];
};

type Props = {
  config: Hotspot5651Config;
  onChange: (config: Hotspot5651Config) => void;
  onSave: () => void;
  saved: boolean;
};

export function Hotspot5651AutomationPanel({ config, onChange, onSave, saved }: Props) {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshStatus() {
    const res = await fetch('/api/compliance/5651/automation');
    if (res.ok) setStatus((await res.json()) as AutomationStatus);
  }

  useEffect(() => {
    void refreshStatus();
  }, [config.lastAutomationRun]);

  async function runNow() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/compliance/5651/automation', { method: 'POST' });
      const j = (await res.json()) as { result?: RunResult };
      if (j.result) {
        setLastResult(j.result);
        setMsg(
          `Provizyon: ${j.result.provisioned}, kapatılan: ${j.result.closed}, senkron: ${j.result.synced.ingested} kayıt`,
        );
      }
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">
        <RefreshCw size={18} /> Otomasyon
      </h2>
      <p className="roomio-page-desc">
        Check-in/out sırasında TESA + WiFi provizyonu otomatik çalışır. Arka plan: konaklayan provizyonu ve cihaz senkronu.
      </p>

      <div className="roomio-form-grid" style={{ marginTop: 12 }}>
        <label className="roomio-field roomio-field--row">
          <input
            type="checkbox"
            checked={config.automationEnabled}
            onChange={(e) => onChange({ ...config, automationEnabled: e.target.checked })}
          />
          <span>Arka plan otomasyonu</span>
        </label>
        <label className="roomio-field">
          <span>Döngü aralığı (dk)</span>
          <input
            className="roomio-input"
            type="number"
            min={1}
            max={60}
            value={config.automationIntervalMinutes}
            onChange={(e) => onChange({ ...config, automationIntervalMinutes: Number(e.target.value) })}
          />
        </label>
        <label className="roomio-field roomio-field--row">
          <input
            type="checkbox"
            checked={config.autoProvisionInHouse}
            onChange={(e) => onChange({ ...config, autoProvisionInHouse: e.target.checked })}
          />
          <span>Konaklayan misafirlere otomatik WiFi provizyonu</span>
        </label>
        <label className="roomio-field roomio-field--row">
          <input
            type="checkbox"
            checked={config.autoSyncDevices}
            onChange={(e) => onChange({ ...config, autoSyncDevices: e.target.checked })}
          />
          <span>MikroTik &amp; UniFi oturum senkronu</span>
        </label>
        <label className="roomio-field roomio-field--row">
          <input
            type="checkbox"
            checked={config.autoTesaOnCheckIn}
            onChange={(e) => onChange({ ...config, autoTesaOnCheckIn: e.target.checked })}
          />
          <span>Check-in&apos;de TESA kart encode</span>
        </label>
      </div>

      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Son çalışma</span>
          <strong className="roomio-kpi-value" style={{ fontSize: '0.8rem' }}>
            {status?.lastRun ? new Date(status.lastRun).toLocaleString('tr-TR') : '—'}
          </strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Aralık</span>
          <strong className="roomio-kpi-value">{status?.intervalMinutes ?? config.automationIntervalMinutes} dk</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Durum</span>
          <strong className="roomio-kpi-value">{config.automationEnabled ? 'Aktif' : 'Kapalı'}</strong>
        </div>
      </div>

      {lastResult?.errors.length ? (
        <p className="roomio-text-warn" style={{ marginTop: 12 }}>
          {lastResult.errors.join(' · ')}
        </p>
      ) : null}
      {msg ? <p className="roomio-page-desc">{msg}</p> : null}

      <div className="roomio-form-actions" style={{ marginTop: 16 }}>
        <Button onClick={() => void runNow()} disabled={busy}>
          {busy ? 'Çalışıyor…' : 'Şimdi çalıştır'}
        </Button>
        <Button variant="secondary" onClick={onSave}>Kaydet</Button>
      </div>
      {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
    </div>
  );
}
