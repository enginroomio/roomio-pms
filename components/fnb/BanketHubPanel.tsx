'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const LINKS = [
  { label: 'Banket Rezervasyon', href: '/fnb', desc: 'Etkinlik ve salon rezervasyonları' },
  { label: 'Banket Ajanda', href: '/fnb?tab=calendar', desc: 'Takvim ve salon doluluk' },
  { label: 'Banket Anlaşmaları', href: '/fnb?tab=agreements', desc: 'Kurumsal anlaşma ve sözleşmeler' },
  { label: 'Salon Tanımları', href: '/fnb?tab=halls', desc: 'Salon kapasite ve özellikler' },
  { label: 'Menü Paketleri', href: '/fnb?tab=menus', desc: 'Banket menü ve paketler' },
  { label: 'Banket Fiyatları', href: '/fnb?tab=rates', desc: 'Salon ve menü tarifeleri' },
  { label: 'Ekipman Listesi', href: '/fnb?tab=equipment', desc: 'Ses, ışık ve mobilya' },
  { label: 'Restoran Tanımları', href: '/fnb?tab=restaurant', desc: 'Outlet ve servis noktaları' },
  { label: 'Hızlı POS', href: '/fnb?mode=quick', desc: 'Restoran hızlı satış' },
  { label: 'POS İndirimleri', href: '/fnb?tab=discounts', desc: 'İndirim kodları' },
  { label: 'Salon Doluluk Raporu', href: '/reports?category=banket&report=occupancy', desc: 'Salon kullanım analizi' },
  { label: 'Etkinlik Gelir Raporu', href: '/reports?category=banket&report=revenue', desc: 'Onaylı banket gelirleri' },
  { label: 'Banket Raporları', href: '/fnb?tab=reports', desc: 'Özet ve dışa aktarma' },
  { label: 'İlk Tanımlar Hub', href: '/fnb?tab=definitions', desc: 'Tüm banket tanım ekranları' },
] as const;

export function BanketHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Banket merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Salon rezervasyonu, anlaşmalar, tanımlar ve banket raporları — Elektra BANKET menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/fnb">+ Yeni rezervasyon</Button>
          <Button variant="secondary" href="/fnb?tab=calendar">Ajanda</Button>
          <Button variant="ghost" href="/fnb?tab=definitions">Tanımlar</Button>
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
