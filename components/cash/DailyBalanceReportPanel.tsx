'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/cash';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';

export function DailyBalanceReportPanel() {
  const { reservations, loading, reload } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const ids = useMemo(() => inhouse.map((g) => g.id), [inhouse]);
  const { balances, reload: reloadFolio } = useFolioBalances(ids);

  const rows = useMemo(
    () => inhouse.map((g) => ({
      ...g,
      folioBalance: balances[g.id] ?? g.folioBalance ?? 0,
    })),
    [inhouse, balances],
  );

  const totalBalance = rows.reduce((s, r) => s + r.folioBalance, 0);
  const withDebt = rows.filter((r) => r.folioBalance > 0).length;
  const credit = rows.filter((r) => r.folioBalance < 0).length;

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Günlük Balanslar</h2>
          <Button variant="secondary" disabled={loading} onClick={() => { void reload(); void reloadFolio(); }}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Konaklayan misafirlerin güncel folyo bakiyeleri.
        </p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{rows.length} konaklayan</span>
          <span className="roomio-badge">Borçlu: {withDebt}</span>
          <span className="roomio-badge">Alacaklı: {credit}</span>
          <span className="roomio-badge">Net: {formatMoney(totalBalance)}</span>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/reports/export?format=csv&module=inhouse">CSV indir</Button>
          <Button variant="ghost" href="/reception/inhouse">Konaklayanlar</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>Misafir</th>
              <th>Rez. no</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Acenta</th>
              <th>Folyo bakiye</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="roomio-table-empty">Konaklayan yok.</td></tr>
            ) : rows
              .sort((a, b) => b.folioBalance - a.folioBalance)
              .map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.roomNo ?? '—'}</strong></td>
                  <td>{r.guestName}</td>
                  <td>{r.refNo}</td>
                  <td>{r.checkIn}</td>
                  <td>{r.checkOut}</td>
                  <td>{r.agency}</td>
                  <td className={r.folioBalance > 0 ? 'roomio-text-warn' : r.folioBalance < 0 ? '' : ''}>
                    {formatMoney(r.folioBalance)}
                  </td>
                  <td>
                    <Link href={`/reception/guest/${r.id}`} className="roomio-link">Folyo</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
