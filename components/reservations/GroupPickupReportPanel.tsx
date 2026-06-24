'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { formatDate } from '@/lib/data/reservations';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

type PickupRow = {
  refNo: string;
  name: string;
  checkIn: string;
  checkOut: string;
  totalAllotted: number;
  totalPickedUp: number;
  pickupPct: number;
};

type Report = {
  businessDate: string;
  rows: PickupRow[];
  totals: { groups: number; roomsAllotted: number; roomsPickedUp: number; pickupPct: number };
};

export function GroupPickupReportPanel() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/reservations/groups?view=pickup-report', { cache: 'no-store' });
      if (!res.ok) throw new Error(await parseApiError(res, 'Pickup raporu yüklenemedi'));
      const json = (await res.json()) as { report?: Report };
      setReport(json.report ?? null);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Pickup raporu yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadPdf() {
    try {
      const res = await roomioFetch('/api/reservations/groups?view=pickup-report&format=pdf');
      if (!res.ok) throw new Error(await parseApiError(res, 'PDF indirilemedi'));
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'grup-pickup.pdf';
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF indirilemedi');
    }
  }

  return (
    <div className="roomio-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="roomio-card-title" style={{ margin: 0, flex: 1 }}>Grup pickup raporu</h2>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
        <Button variant="secondary" onClick={() => void downloadPdf()}>PDF indir</Button>
      </div>
      {error ? (
        <p className="roomio-page-desc roomio-text-warn" role="alert">{error}</p>
      ) : null}
      {report ? (
        <p className="roomio-page-desc">
          {report.totals.groups} grup · {report.totals.roomsPickedUp}/{report.totals.roomsAllotted} oda alındı (%{report.totals.pickupPct})
        </p>
      ) : null}
      <div className="roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>Ref</th><th>Grup</th><th>Tarih</th><th>Allotment</th><th>Alınan</th><th>Pickup %</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Yükleniyor…</td></tr>
            ) : !report?.rows.length ? (
              <tr><td colSpan={6}>Grup kaydı yok</td></tr>
            ) : (
              report.rows.map((r) => (
                <tr key={r.refNo}>
                  <td><strong>{r.refNo}</strong></td>
                  <td>{r.name}</td>
                  <td>{formatDate(r.checkIn)} – {formatDate(r.checkOut)}</td>
                  <td>{r.totalAllotted}</td>
                  <td>{r.totalPickedUp}</td>
                  <td>%{r.pickupPct}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
