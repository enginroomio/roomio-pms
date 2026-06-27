'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type ModuleRow = { label: string; enabled?: boolean; ok?: boolean; detail?: string };

export function IntegrationsSyncStatusPanel() {
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [statusRes, probeRes] = await Promise.all([
        roomioFetch('/api/integrations/status', { cache: 'no-store' }),
        roomioFetch('/api/integrations/live-probe', { cache: 'no-store' }),
      ]);
      if (!statusRes.ok) throw new Error(await parseApiError(statusRes, 'Durum alınamadı'));
      const status = (await statusRes.json()) as Record<string, {
        enabled?: boolean;
        ok?: boolean;
        message?: string;
        connection?: { ok?: boolean; message?: string };
      }>;
      const probe = probeRes.ok
        ? ((await probeRes.json()) as { live?: boolean; probes?: Record<string, { ok: boolean; label: string; message?: string }> })
        : null;
      setLiveMode(Boolean(probe?.live));
      const list: ModuleRow[] = Object.entries(status)
        .filter(([k]) => !k.startsWith('_'))
        .map(([key, v]) => ({
          label: key,
          enabled: v.enabled,
          ok: v.connection?.ok ?? v.ok,
          detail: v.connection?.message ?? v.message,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
      if (probe?.probes) {
        for (const p of Object.values(probe.probes)) {
          list.push({ label: `${p.label} (canlı)`, ok: p.ok, detail: p.message });
        }
      }
      setRows(list);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Yüklenemedi');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Entegrasyon sync durumu</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Modül enable bayrakları ve canlı gateway probeleri.
          {liveMode ? ' Canlı mod aktif.' : ' Simülasyon modu.'}
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="ghost" href="/settings/integrations">Entegrasyon merkezi</Button>
          <Button variant="ghost" href="/tools/deploy">Deploy kontrol</Button>
        </div>
        {msg ? <p className="roomio-page-desc roomio-text-warn" role="status">{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Modül</th><th>Aktif</th><th>Durum</th><th>Detay</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="roomio-table-empty">{loading ? 'Yükleniyor…' : 'Kayıt yok'}</td></tr>
            ) : rows.map((r) => (
              <tr key={r.label}>
                <td><strong>{r.label}</strong></td>
                <td>{r.enabled === undefined ? '—' : r.enabled ? 'Evet' : 'Hayır'}</td>
                <td>
                  {r.ok === undefined ? (
                    <span className="roomio-badge">—</span>
                  ) : r.ok ? (
                    <span className="roomio-badge roomio-badge--ok">OK</span>
                  ) : (
                    <span className="roomio-badge roomio-badge--warn">Hata</span>
                  )}
                </td>
                <td>{r.detail ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
          <Link href="/settings/integrations/channel-manager" className="roomio-link">Kanal yöneticisi</Link>
          {' · '}
          <Link href="/settings/integrations/efatura" className="roomio-link">e-Fatura</Link>
        </p>
      </div>
    </div>
  );
}
