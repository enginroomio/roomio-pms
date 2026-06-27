'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const RAPORLAR_LINKS = [
  { label: 'Rapor Tasarım', href: '/reports?tab=design', desc: 'Şablon ve alan düzenleyici' },
  { label: 'Kullanıcı Raporları', href: '/reports?tab=user', desc: 'Kayıtlı özel raporlar' },
  { label: 'Özel Raporlar', href: '/reports?tab=special', desc: 'Sık kullanılan kısayollar' },
  { label: 'Konsolide', href: '/reports?tab=consolidated', desc: 'Çoklu tesis özeti' },
  { label: 'FO Önbüro', href: '/reports?category=rezervasyon', desc: 'Rezervasyon raporları' },
  { label: 'DL Günlük', href: '/reports?category=gunluk', desc: 'In-house listeler' },
  { label: 'HK Raporları', href: '/reports?category=kathizmetleri', desc: 'Housekeeping durum' },
  { label: 'DR Gelir', href: '/reports?category=gelir', desc: 'Günlük gelir raporları' },
  { label: 'CS Kasa', href: '/reports?category=kontrol', desc: 'Kasa kontrol raporları' },
  { label: 'EGM Kimlik', href: '/reports?category=egm', desc: 'Kimlik bildirim özetleri' },
  { label: 'TIS İstatistik', href: '/reports?category=tis', desc: 'Turizm istatistik' },
  { label: 'TGA Segment', href: '/reports?category=tga', desc: 'Segment ve kanal' },
  { label: 'FC Forecast', href: '/reports?category=forecast', desc: 'Doluluk tahminleri' },
  { label: 'Gün Sonu', href: '/reports?hub=gunsonu', desc: 'Night audit işlemleri' },
] as const;

const GUNSONU_LINKS = [
  { label: 'Rapor Paketi Al', href: '/reports?tab=eod&action=fetch', desc: 'Gün sonu raporlarını indir' },
  { label: 'Günü Kapat', href: '/reports?tab=eod&action=close', desc: 'Night audit kapanış' },
  { label: 'Arşiv', href: '/reports?tab=eod&action=archive', desc: 'Eski gün sonu raporları' },
  { label: 'Yedek Al', href: '/reports?tab=eod&action=backup', desc: 'Veritabanı yedekleme' },
  { label: 'Oda Fiyatları', href: '/reports?tab=eod&action=room-prices', desc: 'Gece fiyat posting' },
  { label: 'Ek Fiyatlar', href: '/reports?tab=eod&action=extra-prices', desc: 'Ekstra ücret basımı' },
  { label: 'Profil Kontrol', href: '/reports?tab=eod&action=profile-check', desc: 'Misafir profil eksikleri' },
  { label: 'Günlük Maliye', href: '/reports?report=gunluk-maliye', desc: 'Kasa özeti' },
  { label: 'Kimlik Listesi', href: '/reception?tab=kimlik', desc: 'Polis bildirim listesi' },
] as const;

export function RaporlarHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Raporlar merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Kategori raporları, tasarım ve dışa aktarma — Elektra RAPORLAR menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/reports?tab=design">Rapor tasarım</Button>
          <Button variant="secondary" href="/reports?tab=user">Kullanıcı raporları</Button>
          <Button variant="ghost" href="/reports?hub=gunsonu">Gün sonu</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {RAPORLAR_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function GunSonuHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Gün sonu merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Night audit, rapor paketi, yedekleme ve gece posting — Elektra GÜN SONU menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/reports?tab=eod&action=fetch">Rapor paketi al</Button>
          <Button variant="secondary" href="/reports?tab=eod&action=close">Günü kapat</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {GUNSONU_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
