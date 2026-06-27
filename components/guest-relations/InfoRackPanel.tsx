'use client';

import { useCallback, useEffect, useState } from 'react';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import type { InfoRackRow } from '@/lib/data/guest-relations';

export function InfoRackPanel() {
  const [rows, setRows] = useState<InfoRackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/info-rack');
      const j = (await res.json()) as { rows?: InfoRackRow[] };
      setRows(j.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="roomio-card roomio-table-wrap">
      <p className="roomio-page-desc" style={{ padding: '12px 16px 0' }}>
        Konaklayan misafirlerden canlı isim listesi (VIP notları dahil).
      </p>
      <table className="roomio-table">
        <thead><tr><th>Oda</th><th>Unvan</th><th>Misafir</th><th>Dil</th><th>Not</th></tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5}>Yükleniyor…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={5}>Konaklayan misafir yok.</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.roomNo}</strong></td>
                <td>{r.title}</td>
                <td>{r.guestName}</td>
                <td>{r.language}</td>
                <td>{r.notes}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <TableFooter total={rows.length} />
    </div>
  );
}
