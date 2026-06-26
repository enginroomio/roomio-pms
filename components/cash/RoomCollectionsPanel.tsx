'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/cash';
import { useCash } from '@/lib/client/use-cash';

function extractRoomNo(description: string): string | null {
  const m = description.match(/Oda\s+(\d{2,4})/i);
  return m?.[1] ?? null;
}

export function RoomCollectionsPanel() {
  const { entries, summary, loading, reload } = useCash();
  const collections = useMemo(
    () => entries.filter((e) => e.type === 'tahsilat' || e.type === 'odeme'),
    [entries],
  );
  const roomCollections = useMemo(
    () => collections.filter((e) => extractRoomNo(e.description) || e.type === 'tahsilat'),
    [collections],
  );

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Günlük oda tahsilatları</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">Tahsilat: {formatMoney(summary.tahsilat)}</span>
          <span className="roomio-badge">{roomCollections.length} hareket</span>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>Saat</th><th>Oda</th><th>Kasa</th><th>Açıklama</th><th>Tutar</th><th>Tip</th><th>Kullanıcı</th></tr>
          </thead>
          <tbody>
            {roomCollections.length === 0 ? (
              <tr><td colSpan={7} className="roomio-table-empty">Bugün oda tahsilatı yok.</td></tr>
            ) : roomCollections.map((e) => (
              <tr key={e.id}>
                <td>{e.time}</td>
                <td><strong>{extractRoomNo(e.description) ?? '—'}</strong></td>
                <td>{e.register}</td>
                <td>{e.description}</td>
                <td className={e.type === 'odeme' ? 'roomio-text-warn' : ''}>{formatMoney(e.amount)}</td>
                <td><span className="roomio-badge">{e.type}</span></td>
                <td>{e.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
