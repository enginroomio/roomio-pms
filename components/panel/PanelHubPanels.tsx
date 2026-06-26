'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const PANEL_LINKS = [
  { label: 'Ana Sayfa', href: '/', desc: 'Dashboard ve oda rack özeti' },
  { label: 'Ana Ekran Dizayn', href: '/tools/theme', desc: 'Tema ve panel düzeni sihirbazı' },
  { label: 'Oda Rack', href: '/rooms', desc: 'Tam ekran oda planı (F12)' },
  { label: 'Günlük Oda Durumu', href: '/?view=daily-status', desc: 'Kat ve durum özeti' },
  { label: 'HK Oda Listesi', href: '/housekeeping/rooms', desc: 'Kat hizmetleri oda listesi' },
  { label: 'Gelişler', href: '/reception/arrivals', desc: 'Bugünkü girişler' },
  { label: 'Ayrılışlar', href: '/reception/departures', desc: 'Bugünkü çıkışlar' },
  { label: 'Rezervasyon Takvimi', href: '/reservations/calendar', desc: 'Grafikler (F1)' },
  { label: 'Resepsiyon', href: '/reception', desc: 'Önbüro operasyon merkezi' },
  { label: 'Raporlar', href: '/reports', desc: 'Raporlama programı' },
] as const;

export function PanelQuickNav({ active }: { active?: 'home' | 'rack' | 'daily-status' | 'panel' }) {
  return (
    <nav className="roomio-tabs roomio-panel-quick-nav" aria-label="Panel kısayolları">
      <Link href="/?hub=panel" className={`roomio-tab${active === 'panel' ? ' is-active' : ''}`}>Panel</Link>
      {PANEL_LINKS.slice(0, 3).map((item) => {
        const key = item.href === '/' ? 'home' : item.href.includes('daily-status') ? 'daily-status' : 'rack';
        const isActive = active === key;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`roomio-tab${isActive ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PanelHubGrid() {
  return (
    <div className="roomio-gr-grid" style={{ marginTop: 16 }}>
      {PANEL_LINKS.map((item) => (
        <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
          <strong>{item.label}</strong>
          <span className="roomio-page-desc">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

export function PanelHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Panel merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Ana ekran, oda rack ve günlük özet — Elektra PANEL menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/">Dashboard</Button>
          <Button variant="secondary" href="/rooms">Room Rack</Button>
          <Button variant="ghost" href="/tools/theme">Ekran dizayn</Button>
        </div>
      </div>
      <PanelHubGrid />
    </div>
  );
}
