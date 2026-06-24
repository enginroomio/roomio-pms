'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { StatusBadge, Button } from '@/components/ui';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { useReservations } from '@/lib/client/use-reservations';
import { formatDate, formatMoney, getInHouseGuests } from '@/lib/data/reception';

export default function InHousePage() {
  const [query, setQuery] = useState('');
  const { reservations, loading, error, reload } = useReservations();
  const inHouseIds = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id),
    [reservations],
  );
  const { balances, error: folioError, reload: reloadFolio } = useFolioBalances(inHouseIds);
  const guests = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = getInHouseGuests(reservations, balances);
    if (!q) return all;
    return all.filter(
      (g) =>
        g.guestName.toLowerCase().includes(q) ||
        (g.roomNo?.includes(q) ?? false) ||
        g.refNo.toLowerCase().includes(q),
    );
  }, [query, reservations, balances]);

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Konaklayanlar Listesi"
      title="Konaklayanlar"
      description="Tesiste konaklayan misafirler — oda, bakiye ve çıkış tarihi."
      actions={
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => {
            void reload();
            void reloadFolio();
          }}
        >
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      }
    >
      <ReceptionTabs />
      <ReceptionLoading loading={loading} error={error} folioError={folioError} />
      <div className="roomio-card roomio-filter-bar">
        <input
          className="roomio-input"
          placeholder="Misafir, oda veya rez. no…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>Misafir</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Tip</th>
              <th>Acenta</th>
              <th>Folyo Bakiye</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && guests.length === 0 ? (
              <tr><td colSpan={9} className="roomio-table-empty">Konaklayan misafir yok.</td></tr>
            ) : (
              guests.map((g) => (
                <tr key={g.id}>
                  <td><strong>{g.roomNo ?? '—'}</strong></td>
                  <td>{g.guestName}</td>
                  <td>{formatDate(g.checkIn)}</td>
                  <td>{formatDate(g.checkOut)}</td>
                  <td>{g.roomType}</td>
                  <td>{g.agency}</td>
                  <td className={g.folioBalance > 0 ? 'roomio-text-warn' : ''}>{formatMoney(g.folioBalance)}</td>
                  <td><StatusBadge status={g.status} /></td>
                  <td><Link href={`/reception/guest/${g.id}`} className="roomio-link">Folyo</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="roomio-table-footer">{guests.length} konaklayan</p>
      </div>
    </PageHeader>
  );
}
