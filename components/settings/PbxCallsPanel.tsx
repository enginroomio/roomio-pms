'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  DEMO_PBX_CALLS,
  loadPbxCallLog,
  savePbxCallLog,
  type PbxCallRecord,
} from '@/lib/integrations/pbx/demo-call-log';

function directionLabel(d: PbxCallRecord['direction']) {
  if (d === 'in') return 'Gelen';
  if (d === 'out') return 'Giden';
  return 'Dahili';
}

function statusLabel(s: PbxCallRecord['status']) {
  if (s === 'answered') return 'Cevaplandı';
  if (s === 'missed') return 'Cevapsız';
  return 'Sesli mesaj';
}

export function PbxCallsPanel() {
  const [rows, setRows] = useState<PbxCallRecord[]>([]);
  const [filter, setFilter] = useState<'all' | PbxCallRecord['status']>('all');

  useEffect(() => {
    setRows(loadPbxCallLog());
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  function resetDemo() {
    setRows(DEMO_PBX_CALLS);
    savePbxCallLog(DEMO_PBX_CALLS);
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Santral çağrı kayıtları</h2>
          <div className="roomio-form-actions">
            <Button variant="secondary" onClick={resetDemo}>Demo veriyi yükle</Button>
            <Button variant="ghost" href="/settings/integrations/pbx">Santral ayarları</Button>
          </div>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          UCM6301 CDR kayıtları (simülasyon). Canlı bağlantı için{' '}
          <Link href="/settings/integrations/pbx" className="roomio-link">Grandstream santral</Link> yapılandırmasını tamamlayın.
        </p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <button type="button" className={`roomio-badge ${filter === 'all' ? 'roomio-badge--ok' : ''}`} onClick={() => setFilter('all')}>
            Tümü ({rows.length})
          </button>
          <button type="button" className={`roomio-badge ${filter === 'missed' ? 'roomio-badge--ok' : ''}`} onClick={() => setFilter('missed')}>
            Cevapsız ({rows.filter((r) => r.status === 'missed').length})
          </button>
          <button type="button" className={`roomio-badge ${filter === 'voicemail' ? 'roomio-badge--ok' : ''}`} onClick={() => setFilter('voicemail')}>
            Sesli mesaj ({rows.filter((r) => r.status === 'voicemail').length})
          </button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Zaman</th>
              <th>Yön</th>
              <th>Dahili</th>
              <th>Oda</th>
              <th>Misafir</th>
              <th>Numara</th>
              <th>Süre</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={8} className="roomio-table-empty">Kayıt yok.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.id}>
                <td>{r.at}</td>
                <td>{directionLabel(r.direction)}</td>
                <td><strong>{r.extension}</strong></td>
                <td>{r.roomNo ?? '—'}</td>
                <td>{r.guestName ?? '—'}</td>
                <td>{r.remote}</td>
                <td>{r.durationSec > 0 ? `${r.durationSec}s` : '—'}</td>
                <td><span className="roomio-badge">{statusLabel(r.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
