'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const RESEPSIYON_LINKS = [
  { label: 'Konaklayanlar', href: '/reception/inhouse', desc: 'In-house misafir listesi' },
  { label: 'Boş Odalar', href: '/reception/vacant', desc: 'Check-in için müsait odalar' },
  { label: 'Gelişler', href: '/reception/arrivals', desc: 'Bugünkü girişler' },
  { label: 'Ayrılışlar', href: '/reception/departures', desc: 'Bugünkü çıkışlar' },
  { label: 'Share Oda', href: '/reception/inhouse?action=share', desc: 'Paylaşımlı oda oluşturma' },
  { label: 'Günlük Oda Durumu', href: '/?view=daily-status', desc: 'Dashboard özet panosu' },
  { label: 'Müsaitlik', href: '/reservations?tab=availability', desc: 'Oda müsaitlik tablosu' },
  { label: 'Planlanan Oda Değişimi', href: '/reception/inhouse?tab=room-changes', desc: 'Room move planları' },
  { label: 'Misafir Talepleri', href: '/reception/guest-requests', desc: 'Guest request kuyruğu' },
  { label: 'Info Rack', href: '/guest-relations/info-rack', desc: 'İsim listesi' },
  { label: 'Kimlik Bildirimi', href: '/reception?tab=kimlik', desc: '5651 polis listesi' },
  { label: 'Traces', href: '/guest-relations/traces', desc: 'Misafir takip notları' },
  { label: 'Şikayetler', href: '/guest-relations/complaints', desc: 'Arıza ve şikayet' },
  { label: 'Uyandırma', href: '/guest-relations/traces?type=wakeup', desc: 'Wake-up call listesi' },
] as const;

const ONKASA_LINKS = [
  { label: 'Kasa Defteri', href: '/reception?tab=kasa', desc: 'Günlük tahsilat ve ödemeler (F6)' },
  { label: 'Kasa Kapatma', href: '/reception?tab=kasa-close', desc: 'Vardiya kapanış listesi' },
  { label: 'Oda Tahsilatları', href: '/reception/arrivals?tab=collections', desc: 'Günlük oda tahsilat' },
  { label: 'Döviz Bozdurma', href: '/reception/departures?tab=fx', desc: 'FX işlem listesi' },
  { label: 'Avans ve Devir', href: '/reception?tab=advance', desc: 'Kasa devir kayıtları' },
  { label: 'Toplu İşlem', href: '/reception/inhouse?tab=bulk', desc: 'Toplu folyo hareketi' },
  { label: 'Peşin Satış', href: '/reception/arrivals?tab=cash-sale', desc: 'Walk-in nakit satış' },
  { label: 'Depozit', href: '/reception/vacant?tab=deposit', desc: 'Depozit tahsilat / iade' },
  { label: 'Günlük Kur', href: '/reception/departures?tab=rates', desc: 'Döviz kuru girişi' },
  { label: 'Günlük Maliye', href: '/reports?report=gunluk-maliye', desc: 'Kasa ve döviz özeti' },
  { label: 'Yazarkasa', href: '/accounting?tab=fiscal', desc: 'Fiscal cihaz kontrol' },
] as const;

function MenuHub({ title, desc, links, primary }: {
  title: string;
  desc: string;
  links: readonly { label: string; href: string; desc: string }[];
  primary: { label: string; href: string };
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">{title}</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>{desc}</p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href={primary.href}>{primary.label}</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ResepsiyonHubPanel() {
  return (
    <MenuHub
      title="Resepsiyon merkezi"
      desc="Check-in, check-out, oda değişimi ve misafir işlemleri — Elektra RESEPSİYON menüsü."
      primary={{ label: 'Gelişler', href: '/reception/arrivals' }}
      links={RESEPSIYON_LINKS}
    />
  );
}

export function OnKasaHubPanel() {
  return (
    <MenuHub
      title="Ön kasa merkezi"
      desc="Kasa defteri, tahsilat, döviz ve depozit — Elektra ÖN KASA menüsü."
      primary={{ label: 'Kasa defteri (F6)', href: '/reception?tab=kasa' }}
      links={ONKASA_LINKS}
    />
  );
}
