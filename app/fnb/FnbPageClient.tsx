'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { BANKET_HALLS, DEMO_BANKET } from '@/lib/data/banket';

export default function FnbPageClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const title = mode === 'quick' ? 'Hızlı POS' : mode === 'card-prep' ? 'Hızlı POS Kart Hazırlama' : 'Banket Rezervasyon';

  return (
    <ModuleLayout
      breadcrumb="Yiyecek & İçecek"
      title={title}
      description="Banket salonları, etkinlik rezervasyonları ve POS işlemleri."
      sideTitle="F&B"
    >
      <nav className="roomio-tabs">
        <Link href="/fnb" className={`roomio-tab${!mode ? ' is-active' : ''}`}>Banket</Link>
        <Link href="/fnb?mode=quick" className={`roomio-tab${mode === 'quick' ? ' is-active' : ''}`}>Hızlı POS</Link>
        <Link href="/fnb?mode=card-prep" className={`roomio-tab${mode === 'card-prep' ? ' is-active' : ''}`}>Kart hazırlama</Link>
      </nav>

      {!mode ? (
        <>
          <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
            <div className="roomio-kpi"><span className="roomio-kpi-label">Salon</span><strong className="roomio-kpi-value">{BANKET_HALLS.length}</strong></div>
            <div className="roomio-kpi"><span className="roomio-kpi-label">Bu hafta etkinlik</span><strong className="roomio-kpi-value">{DEMO_BANKET.length}</strong></div>
            <div className="roomio-kpi"><span className="roomio-kpi-label">Onaylı</span><strong className="roomio-kpi-value">{DEMO_BANKET.filter((b) => b.status === 'confirmed').length}</strong></div>
          </div>
          <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
            <div className="roomio-kurulus-toolbar">
              <h2 className="roomio-card-title">Banket rezervasyonları</h2>
              <Button>+ Yeni etkinlik</Button>
            </div>
            <table className="roomio-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Etkinlik</th>
                  <th>Salon</th>
                  <th>Tarih</th>
                  <th>Saat</th>
                  <th>Kişi</th>
                  <th>İletişim</th>
                  <th>Gelir</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_BANKET.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.eventName}</strong></td>
                    <td>{b.hall}</td>
                    <td>{b.date}</td>
                    <td>{b.startTime}–{b.endTime}</td>
                    <td>{b.pax}</td>
                    <td>{b.contact}</td>
                    <td>₺{b.revenue.toLocaleString('tr-TR')}</td>
                    <td><span className="roomio-badge">{b.status === 'confirmed' ? 'Onaylı' : b.status === 'option' ? 'Opsiyon' : 'İptal'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">{title}</h2>
          <p className="roomio-page-desc">
            {mode === 'card-prep'
              ? 'Konaklayan misafir için POS kartı hazırlayın — oda no ve paket seçimi.'
              : 'Restoran / bar hızlı satış ekranı — oda folyosuna veya nakit tahsilata yönlendirir.'}
          </p>
          <div className="roomio-form-grid" style={{ marginTop: 16 }}>
            <label className="roomio-field"><span>Oda / Masa</span><input className="roomio-input" placeholder="412 veya Masa 12" /></label>
            <label className="roomio-field"><span>Ürün / Paket</span><input className="roomio-input" placeholder="Kahvaltı paketi" /></label>
            <label className="roomio-field"><span>Tutar (TRY)</span><input className="roomio-input" type="number" defaultValue={450} /></label>
          </div>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button>Kaydet</Button>
            <Button variant="secondary" href="/fnb">← Banket listesi</Button>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
