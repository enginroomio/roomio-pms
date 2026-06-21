'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import {
  cashSummary,
  DEMO_CASH_ENTRIES,
  DEMO_KASA_CLOSE,
  formatMoney,
} from '@/lib/data/cash';
import {
  getInHouseGuests,
  getTodayArrivals,
  getTodayDepartures,
  VACANT_ROOMS,
} from '@/lib/data/reception';
import { KimlikBildirimPanel } from '@/app/reception/KimlikBildirimPanel';

export function ReceptionHubClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const inhouse = getInHouseGuests();
  const arrivals = getTodayArrivals();
  const departures = getTodayDepartures();
  const vacantClean = VACANT_ROOMS.filter((r) => r.status === 'CLEAN').length;
  const cash = cashSummary();

  if (tab === 'kimlik' || tab === 'kimlik-new') {
    return (
      <PageHeader breadcrumb="Resepsiyon > Kimlik Bildirimi" title="Polis Kimlik Bildirim Sistemi" description="5651 uyumlu günlük kimlik bildirim listesi.">
        <ReceptionTabs />
        <KimlikBildirimPanel />
      </PageHeader>
    );
  }

  if (tab === 'kasa-close') {
    return (
      <PageHeader breadcrumb="Ön Kasa > Kasa Kapatma" title="Kasa Kapatma Listesi" description="Günlük kasa kapanışları ve fark kontrolü.">
        <ReceptionTabs />
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
              {DEMO_KASA_CLOSE.map((k) => (
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
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr><th>Saat</th><th>Kasa</th><th>Açıklama</th><th>Tutar</th><th>Kullanıcı</th></tr>
            </thead>
            <tbody>
              {DEMO_CASH_ENTRIES.filter((e) => e.type === 'avans').map((e) => (
                <tr key={e.id}>
                  <td>{e.time}</td>
                  <td>{e.register}</td>
                  <td>{e.description}</td>
                  <td>{formatMoney(e.amount)}</td>
                  <td>{e.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb="Resepsiyon"
      title="Resepsiyon & Ön Kasa"
      description="Günlük operasyon, kasa defteri ve hızlı işlemler."
      actions={<Button href="/reservations/new">+ Walk-in Rezervasyon</Button>}
    >
      <ReceptionTabs />

      <div className="roomio-kpi-grid">
        <Link href="/reception/inhouse" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">Konaklayan</div>
          <div className="roomio-kpi-value">{inhouse.length}</div>
        </Link>
        <Link href="/reception/arrivals" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">Bugün Giriş</div>
          <div className="roomio-kpi-value">{arrivals.length}</div>
        </Link>
        <Link href="/reception/departures" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">Bugün Çıkış</div>
          <div className="roomio-kpi-value">{departures.length}</div>
        </Link>
        <Link href="/reception/vacant" className="roomio-kpi roomio-kpi--link">
          <div className="roomio-kpi-label">Boş (Temiz)</div>
          <div className="roomio-kpi-value">{vacantClean}</div>
        </Link>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Günlük tahsilat</div>
          <div className="roomio-kpi-value" style={{ fontSize: '1.1rem' }}>{formatMoney(cash.tahsilat)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Açık kasa</div>
          <div className="roomio-kpi-value">{cash.openRegisters}</div>
        </div>
      </div>

      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <div className="roomio-kurulus-toolbar">
            <h2 className="roomio-card-title">Kasa Defteri — bugün</h2>
            <Button variant="secondary" href="/reception?tab=kasa-close">Kasa kapat</Button>
          </div>
          <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
            <table className="roomio-table">
              <thead>
                <tr><th>Saat</th><th>Kasa</th><th>İşlem</th><th>Açıklama</th><th>Tutar</th></tr>
              </thead>
              <tbody>
                {DEMO_CASH_ENTRIES.map((e) => (
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
          <h2 className="roomio-card-title">Hızlı İşlemler</h2>
          <div className="roomio-quick-actions">
            <Button href="/reception/arrivals">Check-in yap</Button>
            <Button variant="secondary" href="/reception/departures">Check-out yap</Button>
            <Button variant="secondary" href="/reception/departures?tab=fx">Döviz bozdur</Button>
            <Button variant="secondary" href="/reception/vacant?tab=deposit">Depozit al</Button>
            <Button variant="ghost" href="/reservations">Rezervasyon ara</Button>
          </div>
          <h3 className="roomio-card-title" style={{ marginTop: 20, fontSize: '0.95rem' }}>Son Konaklayanlar</h3>
          <ul className="roomio-mini-list">
            {inhouse.slice(0, 4).map((g) => (
              <li key={g.id}>
                <Link href={`/reception/guest/${g.id}`}>
                  <strong>Oda {g.roomNo}</strong> — {g.guestName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageHeader>
  );
}
