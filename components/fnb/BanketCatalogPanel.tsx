'use client';

import { BANKET_HALLS } from '@/lib/data/banket';

type Tab = 'halls' | 'menus' | 'rates' | 'equipment' | 'restaurant';

const EQUIPMENT = ['Projeksiyon', 'Ses sistemi', 'Sahne', 'LED ekran', 'Kokteyl masası', 'Sandalye (extra)'];

export function BanketCatalogPanel({ tab }: { tab: Tab }) {
  if (tab === 'halls') {
    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Salon Tanımları</h2>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Salon</th><th>Kapasite</th><th>Durum</th></tr></thead>
            <tbody>
              {BANKET_HALLS.map((hall) => (
                <tr key={hall}><td><strong>{hall}</strong></td><td>{hall.includes('Ballroom') ? 280 : hall.includes('Terrace') ? 120 : 80}</td><td>Aktif</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'menus') {
    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Menü Paketleri</h2>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Paket</th><th>Kişi fiyatı</th><th>Pansiyon</th></tr></thead>
            <tbody>
              <tr><td>Kokteyl Standart</td><td>₺850</td><td>İçecek dahil</td></tr>
              <tr><td>Öğle Toplantı</td><td>₺1.200</td><td>BB</td></tr>
              <tr><td>Gala Yemeği</td><td>₺2.400</td><td>FB</td></tr>
              <tr><td>Kahve Molası</td><td>₺320</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'rates') {
    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Banket Fiyatları</h2>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Salon</th><th>Günlük kira</th><th>Saatlik</th></tr></thead>
            <tbody>
              {BANKET_HALLS.map((hall) => (
                <tr key={hall}><td>{hall}</td><td>₺{(hall.includes('Ballroom') ? 45000 : 22000).toLocaleString('tr-TR')}</td><td>₺{(hall.includes('Ballroom') ? 6500 : 3800).toLocaleString('tr-TR')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === 'equipment') {
    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Ekipman Listesi</h2>
        <ul className="roomio-page-desc" style={{ marginTop: 12 }}>
          {EQUIPMENT.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    );
  }

  if (tab === 'restaurant') {
    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Restoran Tanımları</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Ana restoran, teras ve oda servisi outlet&apos;leri.</p>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Outlet</th><th>Kapasite</th><th>Servis</th></tr></thead>
            <tbody>
              <tr><td>Ana Restoran</td><td>180</td><td>HB / FB</td></tr>
              <tr><td>Teras</td><td>60</td><td>BB</td></tr>
              <tr><td>Oda Servisi</td><td>—</td><td>24s</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
