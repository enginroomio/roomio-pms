'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { formatMoney } from '@/lib/data/cash';
import { useCash } from '@/lib/client/use-cash';
import { useReservations } from '@/lib/client/use-reservations';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import {
  getInHouseGuests,
  getTodayArrivals,
  getTodayDepartures,
  getVacantRooms,
} from '@/lib/data/reception';
import { CashAdvancePanel } from '@/components/cash/CashAdvancePanel';
import { ResepsiyonHubPanel, OnKasaHubPanel } from '@/components/reception/ReceptionMenuHubPanels';
import { KimlikBildirimPanel } from '@/app/reception/KimlikBildirimPanel';
import { KasaOperationsPanel } from '@/components/reception/KasaOperationsPanel';
import { CashLedgerPanel } from '@/components/reception/CashLedgerPanel';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { useI18n } from '@/components/i18n/I18nProvider';

export function ReceptionHubClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const tab = searchParams.get('tab');
  const { reservations, loading, error, reload } = useReservations();
  const inHouseIds = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id),
    [reservations],
  );
  const { balances, error: folioError, reload: reloadFolio } = useFolioBalances(inHouseIds);
  const { entries: cashEntries, summary: cash, registers: kasaClose, loading: cashLoading, error: cashError, reload: reloadCash } = useCash();

  async function refreshHub() {
    await Promise.all([reload(), reloadFolio(), reloadCash()]);
  }

  const inhouse = useMemo(() => getInHouseGuests(reservations, balances), [reservations, balances]);
  const arrivals = useMemo(() => getTodayArrivals(reservations), [reservations]);
  const departures = useMemo(() => getTodayDepartures(reservations, undefined, balances), [reservations, balances]);
  const vacantRooms = useMemo(() => getVacantRooms(reservations), [reservations]);
  const vacantClean = vacantRooms.filter((r) => r.status === 'CLEAN').length;

  if (hub === 'resepsiyon' && !tab) {
    return (
      <PageHeader breadcrumb="Resepsiyon" title="Resepsiyon Merkezi" description={t('reception.description')}>
        <ReceptionTabs />
        <ResepsiyonHubPanel />
      </PageHeader>
    );
  }

  if (hub === 'onkasa' && !tab) {
    return (
      <PageHeader breadcrumb="Ön Kasa" title="Ön Kasa Merkezi" description="Kasa defteri, tahsilat ve depozit işlemleri.">
        <ReceptionTabs />
        <OnKasaHubPanel />
      </PageHeader>
    );
  }

  if (tab === 'kimlik' || tab === 'kimlik-new') {
    const isNew = tab === 'kimlik-new';
    return (
      <PageHeader
        breadcrumb={`Resepsiyon > ${isNew ? 'Yeni Kimlik Bildirimi' : 'Kimlik Bildirimi'}`}
        title={isNew ? 'Yeni Kimlik Bildirim Sistemi' : 'Polis Kimlik Bildirim Sistemi'}
        description={isNew ? 'Check-in entegrasyonlu hızlı kimlik kaydı ve gönderim.' : '5651 uyumlu günlük kimlik bildirim listesi.'}
      >
        <ReceptionTabs />
        <KimlikBildirimPanel variant={isNew ? 'new' : 'list'} />
      </PageHeader>
    );
  }

  if (tab === 'kasa') {
    return (
      <PageHeader breadcrumb="Ön Kasa > Kasa Defteri" title="Kasa Defteri (F6)" description="Günlük tahsilat, ödeme, avans ve manuel hareketler.">
        <ReceptionTabs />
        <div className="roomio-form-actions" style={{ marginTop: 0, marginBottom: 8 }}>
          <Button
            variant="secondary"
            onClick={() => {
              void roomioFetch('/api/cash?view=ledger&format=pdf')
                .then(async (r) => {
                  if (!r.ok) throw new Error(await parseApiError(r, 'PDF indirilemedi'));
                  return r.blob();
                })
                .then((blob) => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'kasa-defteri.pdf';
                  a.click();
                })
                .catch((err) => {
                  window.alert(err instanceof Error ? err.message : 'PDF indirilemedi');
                });
            }}
          >
            PDF indir
          </Button>
        </div>
        <CashLedgerPanel entries={cashEntries} onDone={() => void reloadCash()} />
      </PageHeader>
    );
  }

  if (tab === 'kasa-close') {
    return (
      <PageHeader breadcrumb="Ön Kasa > Kasa Kapatma" title="Kasa Kapatma Listesi" description="Günlük kasa kapanışları ve fark kontrolü.">
        <ReceptionTabs />
        <div className="roomio-form-actions" style={{ marginTop: 0, marginBottom: 8 }}>
          <Button
            variant="secondary"
            onClick={() => {
              void roomioFetch('/api/cash?view=close-report&format=pdf')
                .then(async (r) => {
                  if (!r.ok) throw new Error(await parseApiError(r, 'PDF indirilemedi'));
                  return r.blob();
                })
                .then((blob) => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'kasa-kapanis.pdf';
                  a.click();
                })
                .catch((err) => {
                  window.alert(err instanceof Error ? err.message : 'PDF indirilemedi');
                });
            }}
          >
            PDF indir (Fidelio)
          </Button>
        </div>
        <KasaOperationsPanel registers={kasaClose} onDone={() => void reloadCash()} />
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Kasa</th>
                <th>Açılış</th>
                <th>Kapanış</th>
                <th>Açılış bakiye</th>
                <th>Kapanış bakiye</th>
                <th>Fark</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {kasaClose.map((k) => (
                <tr key={k.id}>
                  <td><strong>{k.register}</strong></td>
                  <td>{k.openedAt}</td>
                  <td>{k.closedAt ?? '—'}</td>
                  <td>{formatMoney(k.openingBalance)}</td>
                  <td>{k.closingBalance != null ? formatMoney(k.closingBalance) : '—'}</td>
                  <td className={k.variance !== 0 ? 'roomio-text-warn' : ''}>{formatMoney(k.variance)}</td>
                  <td><span className={`roomio-badge roomio-badge--${k.status === 'open' ? 'ok' : 'muted'}`}>{k.status === 'open' ? 'Açık' : 'Kapalı'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageHeader>
    );
  }

  if (tab === 'advance') {
    return (
      <PageHeader breadcrumb="Ön Kasa > Avans & Devir" title="Kasa Avans ve Devir Listesi" description="Vardiya devirleri ve avans kayıtları.">
        <ReceptionTabs />
        <CashAdvancePanel />
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb="Resepsiyon"
      title={t('reception.title')}
      description={t('reception.description')}
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            disabled={loading || cashLoading}
            onClick={() => void refreshHub()}
          >
            {loading || cashLoading ? t('reception.loading') : t('reception.refresh')}
          </Button>
          <Button href="/reservations/new">{t('reception.walkIn')}</Button>
        </div>
      }
    >
      <ReceptionTabs />
      <ReceptionLoading loading={loading || cashLoading} error={error} folioError={folioError} cashError={cashError} />

      <div className="roomio-kpi-grid">
        <Link href="/reception/inhouse" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">{t('reception.kpi.inhouse')}</div>
          <div className="roomio-kpi-value">{loading ? '…' : inhouse.length}</div>
        </Link>
        <Link href="/reception/arrivals" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">{t('reception.kpi.arrivals')}</div>
          <div className="roomio-kpi-value">{loading ? '…' : arrivals.length}</div>
        </Link>
        <Link href="/reception/departures" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">{t('reception.kpi.departures')}</div>
          <div className="roomio-kpi-value">{loading ? '…' : departures.length}</div>
        </Link>
        <Link href="/reception/vacant" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">{t('reception.kpi.vacantClean')}</div>
          <div className="roomio-kpi-value">{loading ? '…' : vacantClean}</div>
        </Link>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">{t('reception.kpi.dailyCollection')}</div>
          <div className="roomio-kpi-value" style={{ fontSize: '1.1rem' }}>{formatMoney(cash.tahsilat)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">{t('reception.kpi.openRegisters')}</div>
          <div className="roomio-kpi-value">{cash.openRegisters}</div>
        </div>
      </div>

      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <div className="roomio-kurulus-toolbar">
            <h2 className="roomio-card-title">{t('reception.ledgerToday')}</h2>
            <Button variant="secondary" href="/reception?tab=kasa-close">{t('reception.closeRegister')}</Button>
          </div>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead>
                <tr><th>Saat</th><th>Kasa</th><th>İşlem</th><th>Açıklama</th><th>Tutar</th></tr>
              </thead>
              <tbody>
                {cashEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.time}</td>
                    <td>{e.register}</td>
                    <td><span className="roomio-badge">{e.type}</span></td>
                    <td>{e.description}</td>
                    <td>{formatMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="roomio-card">
          <h2 className="roomio-card-title">{t('reception.quickActions')}</h2>
          <div className="roomio-quick-actions">
            <Button href="/reception/arrivals">{t('reception.checkIn')}</Button>
            <Button variant="secondary" href="/reception/departures">{t('reception.checkOut')}</Button>
            <Button variant="secondary" href="/reception/guest-requests">{t('reception.guestRequest')}</Button>
            <Button variant="secondary" href="/reception/departures?tab=fx">{t('reception.fxExchange')}</Button>
            <Button variant="secondary" href="/reception/vacant?tab=deposit">{t('reception.deposit')}</Button>
            <Button variant="ghost" href="/reservations">{t('reception.searchReservation')}</Button>
          </div>
          <h3 className="roomio-card-title" style={{ marginTop: 20, fontSize: '0.95rem' }}>{t('reception.recentInhouse')}</h3>
          <ul className="roomio-mini-list">
            {inhouse.slice(0, 4).map((g) => (
              <li key={g.id}>
                <Link href={`/reception/guest/${g.id}`}>
                  <strong>{t('reception.room', { room: g.roomNo ?? '—' })}</strong> — {g.guestName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageHeader>
  );
}
