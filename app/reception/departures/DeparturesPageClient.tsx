'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { Button } from '@/components/ui';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { formatMoney } from '@/lib/data/cash';
import { ExchangeRatesTable } from '@/components/exchange/ExchangeRatesTable';
import { FxExchangeForm } from '@/components/exchange/FxExchangeForm';
import { FxExchangeList } from '@/components/exchange/FxExchangeList';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { useReservations } from '@/lib/client/use-reservations';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { formatDate, getTodayDepartures } from '@/lib/data/reception';

export default function DeparturesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const roomFilter = searchParams.get('room')?.trim() ?? '';
  const { reservations, loading, error, reload } = useReservations();
  const departureIds = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id),
    [reservations],
  );
  const { balances, error: folioError, reload: reloadFolio } = useFolioBalances(departureIds);
  const departures = useMemo(() => {
    const all = getTodayDepartures(reservations, undefined, balances);
    if (!roomFilter) return all;
    return all.filter((g) => g.roomNo === roomFilter);
  }, [reservations, balances, roomFilter]);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [fxReload, setFxReload] = useState(0);

  async function checkout(id: string, roomNo: string, guestName: string) {
    setBusyId(id);
    setMsg(null);

    try {
      const res = await roomioFetch('/api/reception/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNo, guestName, reservationId: id }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Check-out başarısız'));
      const j = (await res.json()) as { messages?: string[] };
      setMsg(j.messages?.join(' · ') ?? 'Check-out tamamlandı');
      setDoneId(id);
      await reload();
      await reloadFolio();
      setTimeout(() => router.refresh(), 600);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Check-out başarısız');
    } finally {
      setBusyId(null);
    }
  }

  if (tab === 'fx' || tab === 'rates') {
    return (
      <PageHeader
        breadcrumb={`Ön Kasa > ${tab === 'rates' ? 'Günlük Kur' : 'Döviz Bozdurma'}`}
        title={tab === 'rates' ? 'Günlük Kur Girişi' : 'Döviz Bozdurma Listesi'}
        description="Misafir döviz işlemleri ve güncel kurlar."
      >
        <ReceptionTabs />
        <nav className="roomio-tabs" style={{ marginTop: 8 }}>
          <Link href="/reception/departures?tab=fx" className={`roomio-tab${tab === 'fx' ? ' is-active' : ''}`}>Bozdurma listesi</Link>
          <Link href="/reception/departures?tab=rates" className={`roomio-tab${tab === 'rates' ? ' is-active' : ''}`}>Günlük kurlar</Link>
          <Link href="/reception/departures" className="roomio-tab">Bugün çıkış</Link>
        </nav>

        {tab === 'rates' ? (
          <ExchangeRatesTable title="Günlük Kur — TCMB" />
        ) : (
          <>
            <FxExchangeForm onDone={() => setFxReload((n) => n + 1)} />
            <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
              <FxExchangeList reloadKey={fxReload} />
            </div>
          </>
        )}
      </PageHeader>
    );
  }

  async function refreshAll() {
    await reload();
    await reloadFolio();
  }

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Bugün Çıkış"
      title="Bugün Çıkış Yapacaklar"
      description="Check-out, TESA kart iptali, 5651 WiFi oturumu kapatma ve UCM6301 santral güncellemesi."
      actions={
        <Button variant="secondary" disabled={loading} onClick={() => void refreshAll()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      }
    >
      <ReceptionTabs />
      {roomFilter ? (
        <p className="roomio-page-desc" role="status">
          Oda filtresi: <strong>{roomFilter}</strong>
          {' · '}
          <Link href="/reception/departures">Filtreyi kaldır</Link>
        </p>
      ) : null}
      {msg ? (
        <p className={`roomio-page-desc${msg.includes('başarısız') || msg.includes('yetkiniz') || msg.includes('Oturum') ? ' roomio-text-warn' : ''}`} role="status">
          {msg}
        </p>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Oda</th>
              <th>Misafir</th>
              <th>Tip</th>
              <th>Folyo Bakiye</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && departures.length === 0 ? (
              <tr><td colSpan={5} className="roomio-table-empty">Bugün çıkış bekleyen misafir yok.</td></tr>
            ) : (
              departures.map((g) => (
                <tr key={g.id} className={doneId === g.id ? 'roomio-row-done' : ''}>
                  <td><strong>{g.roomNo}</strong></td>
                  <td>{g.guestName}</td>
                  <td>{g.roomType}</td>
                  <td className={g.folioBalance > 0 ? 'roomio-text-warn' : ''}>{formatMoney(g.folioBalance)}</td>
                  <td>
                    {doneId === g.id ? (
                      <span className="roomio-badge">Check-out tamam</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" href={`/reception/guest/${g.id}`}>Folyo</Button>
                        <Button
                          disabled={busyId === g.id}
                          onClick={() => void checkout(g.id, g.roomNo ?? '', g.guestName)}
                        >
                          {busyId === g.id ? 'İşleniyor…' : 'Check-out'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
