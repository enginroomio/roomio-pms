'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const LINKS = [
  { label: 'Grafikler (F1)', href: '/reservations/calendar', desc: 'Aylık doluluk ve fiyat grafiği' },
  { label: 'Yeni Rezervasyon', href: '/reservations/new', desc: 'Walk-in ve telefon kaydı' },
  { label: 'Rezervasyon Listesi', href: '/reservations', desc: 'Tüm rezervasyonlar ve filtreler' },
  { label: 'Toplu Rezervasyon', href: '/groups', desc: 'Grup ve blok rezervasyon' },
  { label: 'Durum Takip', href: '/reservations?track=1', desc: 'Opsiyon ve onay bekleyenler' },
  { label: 'Konaklayanlar', href: '/reception/inhouse', desc: 'In-house misafir listesi' },
  { label: 'Ayrılanlar', href: '/reservations?status=CHECKED_OUT', desc: 'Check-out yapılmış kayıtlar' },
  { label: 'Bekleme Listesi', href: '/reservations?status=OPTION', desc: 'Opsiyon rezervasyonlar' },
  { label: 'İptal Listesi', href: '/reservations?status=CANCELLED', desc: 'İptal edilmiş kayıtlar' },
  { label: 'No Show', href: '/reservations?status=NO_SHOW', desc: 'Gelmeyen misafirler' },
  { label: 'Acenta Aktarım', href: '/reservations?tab=import', desc: 'Channel / acenta import' },
  { label: 'Mailden Oku', href: '/reservations?tab=email', desc: 'E-posta rezervasyon parse' },
  { label: 'Hızlı Blokaj', href: '/rooms?tab=blocking', desc: 'Oda blokaj tablosu' },
  { label: 'Boş Odalar', href: '/reception/vacant', desc: 'Müsait oda listesi' },
  { label: 'Müsaitlik Tablosu', href: '/reservations?tab=availability', desc: 'Oda tipi müsaitlik' },
  { label: 'Grup Kodları', href: '/reservations?tab=group-codes', desc: 'Grup kod listesi' },
  { label: 'Transfer Raporu', href: '/reports?report=transfer', desc: 'Havalimanı transfer listesi' },
] as const;

export function RezervasyonHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Rezervasyon merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Grafik, liste, aktarım ve blokaj — Elektra REZERVASYON menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/reservations/new">+ Yeni rezervasyon</Button>
          <Button variant="secondary" href="/reservations/calendar">Takvim (F1)</Button>
          <Button variant="ghost" href="/reservations">Liste</Button>
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
