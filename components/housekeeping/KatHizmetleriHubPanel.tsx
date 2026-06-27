'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const LINKS = [
  { label: 'Oda Listesi', href: '/housekeeping/rooms', desc: 'Kat bazlı oda durumu ve filtreler' },
  { label: 'Room Rack (F12)', href: '/rooms', desc: 'Tam ekran oda planı' },
  { label: 'Yeni Room Rack', href: '/rooms?view=new-rack', desc: 'Klasik rack görünümü' },
  { label: 'Günlük Oda Durumu', href: '/?view=daily-status', desc: 'Dashboard özet panosu' },
  { label: 'Blokaj Tablosu', href: '/rooms?tab=blocking', desc: 'Hızlı oda blokajı' },
  { label: 'Boş Oda Listesi', href: '/reception/vacant', desc: 'Müsait ve temiz odalar' },
  { label: 'Kapalı Oda Listesi', href: '/rooms?filter=closed', desc: 'OOO / OOS odalar' },
  { label: 'HK Operasyon Merkezi', href: '/housekeeping/operations', desc: 'Atama, arıza ve talepler' },
  { label: 'HK Oda Kontrolü', href: '/housekeeping/rooms?tab=control', desc: 'Süpervizör kontrol listesi' },
  { label: 'Housekeeper Kontrol Listesi', href: '/housekeeping/tasks?tab=checklist', desc: 'Günlük görevler' },
  { label: 'Kontrol Arşivi', href: '/housekeeping/tasks?tab=archive', desc: 'Tamamlanan kontroller' },
  { label: 'HK Raporları', href: '/reports?category=kathizmetleri', desc: 'Durum, kirli, temiz, OOO' },
  { label: 'Enerji Tüketim Tablosu', href: '/reports?report=enerji', desc: 'Oda bazlı enerji özeti' },
  { label: 'Oda Demirbaş Listesi', href: '/reports?report=demirbas', desc: 'Envanter ve demirbaş' },
  { label: 'Takip Listesi (Traces)', href: '/guest-relations/traces', desc: 'Misafir ve oda notları' },
  { label: 'Kayıp ve Bulunan', href: '/guest-relations/lost-found', desc: 'Lost & found kayıtları' },
  { label: 'Arıza ve Şikayet', href: '/guest-relations/complaints', desc: 'Bakım ve şikayet listesi' },
  { label: 'Arıza Kayıtları', href: '/housekeeping/faults', desc: 'Teknik arıza takibi' },
  { label: 'Mobil HK', href: '/housekeeping/mobile', desc: 'Katçı mobil ekran' },
] as const;

export function KatHizmetleriHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Kat hizmetleri merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Oda rack, housekeeping operasyonları, kontrol listeleri ve HK raporları — Elektra KAT HİZMETLERİ menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/housekeeping/operations">HK operasyon</Button>
          <Button variant="secondary" href="/rooms">Room Rack</Button>
          <Button variant="ghost" href="/housekeeping/rooms">Oda listesi</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
