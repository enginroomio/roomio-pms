'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reservations';
import { DEMO_EOD_ARCHIVE } from '@/lib/data/eod';
import {
  DEMO_DEPT_REVENUE_OLD,
  DEMO_MARKET_DISTRIBUTION,
} from '@/lib/data/back-office';
import { KrediKontrolPanel } from '@/components/accounting/BackOfficePanels';
import { useReservations } from '@/lib/client/use-reservations';

export function ManagementPrepareHub() {
  const items = [
    { href: '/reports?tab=prepare', label: 'Rapor Hazırla', desc: 'Şablon seçerek özel rapor üret' },
    { href: '/reports?tab=cube', label: 'Gelir Küpü Analizi', desc: 'Çok boyutlu gelir analizi' },
    { href: '/reports?tab=occupancy', label: 'Detaylı Doluluk Grafiği', desc: 'Forecast doluluk görünümü' },
    { href: '/reports?tab=3year', label: '3 Yıllık Doluluk', desc: 'Uzun dönem doluluk trendi' },
    { href: '/reports?tab=dept', label: 'Departman Gelirleri', desc: 'Departman bazlı gelir özeti' },
    { href: '/reports?tab=management', label: 'Yönetim Özet Raporu', desc: 'Günlük yönetim KPI özeti' },
  ];

  return (
    <div className="roomio-gr-grid">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
          <strong>{item.label}</strong>
          <span className="roomio-page-desc">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

export function ManagementSummaryPanel({ variant }: { variant: string }) {
  const { reservations } = useReservations();
  const checkedIn = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const totalRooms = 120;
  const occ = Math.round((checkedIn / totalRooms) * 100);

  const titles: Record<string, string> = {
    prepare: 'Rapor Hazırlama',
    cube: 'Gelir Küpü Analizi',
    occupancy: 'Detaylı Doluluk Grafiği',
    '3year': '3 Yıllık Doluluk',
    dept: 'Departman Gelirleri',
    management: 'Yönetim Özet Raporu',
  };

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">{titles[variant] ?? 'Yönetim Raporu'}</h2>
        <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Doluluk</span><strong className="roomio-kpi-value">%{occ}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Konaklayan</span><strong className="roomio-kpi-value">{checkedIn}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Rezervasyon</span><strong className="roomio-kpi-value">{reservations.length}</strong></div>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/reports?tab=design">Şablon tasarımı</Button>
          <Button variant="ghost" href="/reports?tab=prepare">Rapor hazırlama merkezi</Button>
        </div>
      </div>
      {variant === '3year' ? (
        <div className="roomio-card" style={{ marginTop: 12, padding: 16 }}>
          <table className="roomio-table">
            <thead><tr><th>Yıl</th><th>Ort. doluluk</th><th>ADR</th><th>RevPAR</th></tr></thead>
            <tbody>
              <tr><td>2024</td><td>%68</td><td>₺4.820</td><td>₺3.278</td></tr>
              <tr><td>2025</td><td>%72</td><td>₺5.140</td><td>₺3.701</td></tr>
              <tr><td>2026 (YTD)</td><td>%74</td><td>₺5.380</td><td>₺3.981</td></tr>
            </tbody>
          </table>
        </div>
      ) : null}
      {variant === 'dept' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Departman</th><th>Günlük gelir</th><th>Pay</th></tr></thead>
            <tbody>
              <tr><td>Oda</td><td>{formatMoney(248500)}</td><td>%62</td></tr>
              <tr><td>F&B</td><td>{formatMoney(62400)}</td><td>%16</td></tr>
              <tr><td>Spa</td><td>{formatMoney(18200)}</td><td>%5</td></tr>
              <tr><td>Diğer</td><td>{formatMoney(8400)}</td><td>%2</td></tr>
            </tbody>
          </table>
        </div>
      ) : null}
      {variant === 'cube' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
          <p className="roomio-page-desc" style={{ marginBottom: 8 }}>
            Segment × departman gelir matrisi — çok boyutlu kesit.
          </p>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Oda</th>
                <th>F&amp;B</th>
                <th>Spa</th>
                <th>Diğer</th>
                <th>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_MARKET_DISTRIBUTION.map((row) => (
                <tr key={row.segment}>
                  <td><strong>{row.segment}</strong></td>
                  <td>{formatMoney(row.revenue * 0.7)}</td>
                  <td>{formatMoney(row.revenue * 0.18)}</td>
                  <td>{formatMoney(row.revenue * 0.07)}</td>
                  <td>{formatMoney(row.revenue * 0.05)}</td>
                  <td>{formatMoney(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function DeptRevenueOldPanel() {
  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Eski Tarihli Departman Gelirleri</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Arşivlenmiş günlük departman gelir satırları.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Tarih</th><th>Oda</th><th>F&B</th><th>Spa</th><th>Diğer</th><th>Toplam</th></tr>
          </thead>
          <tbody>
            {DEMO_DEPT_REVENUE_OLD.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{formatMoney(row.rooms)}</td>
                <td>{formatMoney(row.fb)}</td>
                <td>{formatMoney(row.spa)}</td>
                <td>{formatMoney(row.other)}</td>
                <td><strong>{formatMoney(row.rooms + row.fb + row.spa + row.other)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DistributionAnalysisPanel() {
  const total = useMemo(
    () => DEMO_MARKET_DISTRIBUTION.reduce((s, r) => s + r.revenue, 0),
    [],
  );

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Dağılım Analizi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Segment bazlı oda ve gelir dağılımı.</p>
        <div className="roomio-kpi" style={{ marginTop: 12 }}>
          <span className="roomio-kpi-label">Toplam gelir</span>
          <strong className="roomio-kpi-value">{formatMoney(total)}</strong>
        </div>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Segment</th><th>Oda gece</th><th>Gelir</th><th>Pay %</th></tr>
          </thead>
          <tbody>
            {DEMO_MARKET_DISTRIBUTION.map((row) => (
              <tr key={row.segment}>
                <td><strong>{row.segment}</strong></td>
                <td>{row.rooms}</td>
                <td>{formatMoney(row.revenue)}</td>
                <td>{row.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MgmtOldReportPanel() {
  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Eski Tarihli Günlük Yönetim Raporu</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Gün sonu arşivinden yönetim özetleri.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>İş günü</th><th>Kapanış</th><th>Kapatan</th><th>Doluluk %</th><th>Gelir</th></tr>
          </thead>
          <tbody>
            {DEMO_EOD_ARCHIVE.map((a) => (
              <tr key={a.id}>
                <td>{a.businessDate}</td>
                <td>{a.closedAt}</td>
                <td>{a.closedBy}</td>
                <td>{a.occupancy}%</td>
                <td>{formatMoney(a.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeptTransferPanel() {
  const rows = [
    { dept: 'Oda Geliri', source: 'FO', target: 'Muhasebe', amount: 248500, status: 'aktarıldı' },
    { dept: 'F&B', source: 'POS', target: 'Muhasebe', amount: 62400, status: 'bekliyor' },
    { dept: 'Spa', source: 'Spa Modül', target: 'Muhasebe', amount: 18200, status: 'aktarıldı' },
    { dept: 'Banket', source: 'Banket', target: 'Muhasebe', amount: 95000, status: 'planlandı' },
  ];

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Departman Gelirleri Aktarım</h2>
          <Button variant="secondary">Aktarımı başlat</Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Günlük departman gelirlerinin muhasebe defterine aktarımı.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Departman</th><th>Kaynak</th><th>Hedef</th><th>Tutar</th><th>Durum</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dept}>
                <td><strong>{r.dept}</strong></td>
                <td>{r.source}</td>
                <td>{r.target}</td>
                <td>{formatMoney(r.amount)}</td>
                <td><span className="roomio-badge">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { KrediKontrolPanel };
