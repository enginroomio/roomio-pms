'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import type { InHouseGuestRow } from '@/lib/data/guest-relations';

type Summary = {
  total: number;
  vip: number;
  international: number;
  rows: InHouseGuestRow[];
};

export function GrInHousePanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/gr-inhouse');
      const j = (await res.json()) as Summary & { ok?: boolean };
      setData(j);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="roomio-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Konaklayan</span><strong className="roomio-kpi-value">{loading ? '…' : data?.total ?? 0}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">VIP</span><strong className="roomio-kpi-value">{loading ? '…' : data?.vip ?? 0}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Yabancı uyruk</span><strong className="roomio-kpi-value">{loading ? '…' : data?.international ?? 0}</strong></div>
      </div>
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Oda</th><th>Misafir</th><th>Uyruk</th><th>Giriş</th><th>Çıkış</th><th>VIP</th><th /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Yükleniyor…</td></tr>
            ) : !data?.rows.length ? (
              <tr><td colSpan={7}>Konaklayan misafir yok.</td></tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.roomNo}</strong></td>
                  <td>{r.guestName}</td>
                  <td>{r.nationality}</td>
                  <td>{r.arrival}</td>
                  <td>{r.departure}</td>
                  <td>{r.vip ? '★' : '—'}</td>
                  <td><Link href={`/reception/guest/${r.id}`}>Folyo</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={data?.rows.length ?? 0} />
      </div>
    </>
  );
}
