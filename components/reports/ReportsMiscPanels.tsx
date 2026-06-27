'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reservations';
import { DEMO_MARKET_DISTRIBUTION } from '@/lib/data/back-office';
import { CATEGORY_REPORTS } from '@/lib/data/eod';
import { useReservations } from '@/lib/client/use-reservations';

export function SpecialReportsPanel() {
  const items = [
    { label: 'Transfer Listesi', href: '/reports?report=transfer', desc: 'Geliş/gidiş transfer raporu' },
    { label: 'Oda Değişim Listesi', href: '/reports?report=room-changes', desc: 'Planlanan oda taşımaları' },
    { label: 'Günlük Maliye', href: '/reports?report=gunluk-maliye', desc: 'Kasa ve maliye özeti' },
    { label: 'Kredi Kontrol', href: '/reports?report=kredi-kontrol', desc: 'Cari limit takibi' },
    { label: 'Sürekli Misafir (Fr3)', href: '/guest-relations/repeat-guests?format=fr3', desc: 'FastReport formatında repeater' },
  ];

  return (
    <div className="roomio-gr-grid" style={{ marginTop: 16 }}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
          <strong>{item.label}</strong>
          <span className="roomio-page-desc">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

export function RemoteReportsPanel() {
  const properties = [
    { name: 'Hotel Sapphire Antalya', code: 'HS-ANT', status: 'online', lastSync: '2026-06-18 06:12' },
    { name: 'Hotel Sapphire Bodrum', code: 'HS-BOD', status: 'online', lastSync: '2026-06-18 06:08' },
    { name: 'Hotel Sapphire Cappadocia', code: 'HS-CAP', status: 'offline', lastSync: '2026-06-17 23:55' },
  ];

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <h2 className="roomio-card-title">Uzak Otelden Raporlama</h2>
        <p className="roomio-page-desc">Merkez ofisten bağlı tesislere rapor çekme.</p>
      </div>
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tesis</th><th>Kod</th><th>Bağlantı</th><th>Son senkron</th><th /></tr></thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.code}>
                <td><strong>{p.name}</strong></td>
                <td>{p.code}</td>
                <td><span className={`roomio-badge${p.status === 'online' ? ' roomio-badge--ok' : ''}`}>{p.status}</span></td>
                <td>{p.lastSync}</td>
                <td>
                  <Button variant="secondary" href={`/reports?tab=consolidated&property=${encodeURIComponent(p.code)}`} disabled={p.status !== 'online'}>
                    Rapor al
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AgencyAnalysisPanel() {
  const { reservations } = useReservations();
  const byAgency = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const r of reservations) {
      const key = r.agency || r.market || 'Direct';
      const nights = Math.max(1, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000));
      const cur = map.get(key) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += r.rate * nights;
      map.set(key, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  }, [reservations]);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Acenta Analiz (Gün, Ay, Yıl)</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Canlı rezervasyon verisinden acenta üretim özeti.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead><tr><th>Acenta</th><th>Rezervasyon</th><th>Tahmini gelir</th></tr></thead>
          <tbody>
            {byAgency.length === 0 ? (
              <tr><td colSpan={3} className="roomio-table-empty">Veri yok.</td></tr>
            ) : byAgency.map(([name, stats]) => (
              <tr key={name}><td><strong>{name}</strong></td><td>{stats.count}</td><td>{formatMoney(stats.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MarketRateAnalysisPanel() {
  const rows = DEMO_MARKET_DISTRIBUTION.map((r) => ({
    ...r,
    adr: r.rooms > 0 ? Math.round(r.revenue / r.rooms) : 0,
  }));

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Market Rate Analiz</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Segment bazlı ADR ve gelir dağılımı.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead><tr><th>Segment</th><th>Oda gece</th><th>Gelir</th><th>ADR</th><th>Pay %</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.segment}>
                <td><strong>{r.segment}</strong></td>
                <td>{r.rooms}</td>
                <td>{formatMoney(r.revenue)}</td>
                <td>{formatMoney(r.adr)}</td>
                <td>{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NationalityReportPanel() {
  const { reservations } = useReservations();
  const byNat = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) {
      const n = r.extraData?.nationality ?? r.market ?? '—';
      map.set(n, (map.get(n) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [reservations]);

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">Uyruk Raporu</h2>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead><tr><th>Uyruk</th><th>Rezervasyon</th></tr></thead>
        <tbody>
          {byNat.map(([nat, count]) => (
            <tr key={nat}><td><strong>{nat}</strong></td><td>{count}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MgmtEngReportPanel() {
  const { reservations } = useReservations();
  const checkedIn = reservations.filter((r) => r.status === 'CHECKED_IN').length;

  return (
    <div className="roomio-card" style={{ marginTop: 16, padding: 20 }}>
      <h2 className="roomio-card-title">Management Report (English)</h2>
      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Occupancy</span><strong className="roomio-kpi-value">{checkedIn} rooms</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Reservations</span><strong className="roomio-kpi-value">{reservations.length}</strong></div>
      </div>
      <div className="roomio-form-actions" style={{ marginTop: 16 }}>
        <Button variant="secondary" href="/api/reports/export?format=pdf&category=yonetim&lang=en">Download PDF</Button>
      </div>
    </div>
  );
}

export function ReportCategoryHub({ category, label }: { category: string; label: string }) {
  const reports = CATEGORY_REPORTS[category] ?? [
    { id: 'default', name: `${label} — Özet`, format: 'PDF' },
    { id: 'detail', name: `${label} — Detay`, format: 'PDF / Excel' },
  ];

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <h2 className="roomio-card-title">{label}</h2>
      <p className="roomio-page-desc">
        Kategori raporları — önizleme ve dışa aktarma.
        {' '}
        <Link href="/reports">← Tüm kategoriler</Link>
      </p>
      <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead><tr><th>Rapor</th><th>Format</th><th /></tr></thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.format}</td>
                <td>
                  <Button variant="secondary" href={`/api/reports/export?format=pdf&category=${encodeURIComponent(category)}&report=${encodeURIComponent(r.id)}`}>PDF</Button>
                  {' '}
                  <Button variant="secondary" href={`/api/reports/export?format=csv&category=${encodeURIComponent(category)}&report=${encodeURIComponent(r.id)}`}>CSV</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
