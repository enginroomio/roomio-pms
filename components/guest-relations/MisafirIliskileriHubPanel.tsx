'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

const EXTRA_LINKS = [
  { label: 'CRM Mesajları', href: '/guest-relations?tab=messages', desc: 'Portal, WhatsApp ve e-posta kanalları' },
  { label: 'Adres ve Tel Rehberi', href: '/guest-relations?tab=directory', desc: 'Otel içi ve acil iletişim' },
  { label: 'Misafir Profili', href: '/reception/guest-profile', desc: 'Kart arama ve profil düzenleme' },
  { label: 'Oda Bekleme Kuyruğu', href: '/reception/queue', desc: 'Erken giriş / geç çıkış talepleri' },
  { label: 'GR Raporları', href: '/reports?category=crm', desc: 'Misafir ve CRM rapor kategorisi' },
] as const;

const DESC: Record<string, string> = {
  traces: 'Misafir talepleri, uyandırma ve departman notları',
  inhouse: 'Konaklayan misafir listesi ve oda bilgisi',
  'info-rack': 'Alfabetik isim listesi ve oda eşleştirme',
  restaurant: 'Restoran masa rezervasyonları',
  tennis: 'Tenis kortu rezervasyon takvimi',
  daily: 'Günlük otel aktivite programı',
  'guest-act': 'Misafir bazlı aktivite kayıtları',
  weather: 'Bugünkü hava durumu özeti',
  forecast: '5 günlük hava tahmini',
  complaints: 'Arıza ve şikayet takip listesi',
  lost: 'Kayıp eşya ve buluntu kayıtları',
  reviews: 'Misafir yorumları ve puanlar',
  'review-new': 'Yeni misafir yorumu girişi',
  reclamation: 'Reklamasyon ve tazmin süreçleri',
  vip: 'VIP segment ve özel hizmet listesi',
  repeat: 'Sadakat ve tekrarlayan konaklayanlar',
};

export function MisafirIliskileriHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Misafir ilişkileri merkezi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Takip, aktivite, yorum, şikayet ve VIP yönetimi — Elektra MİSAFİR İLİŞKİLERİ menüsü.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button href="/guest-relations/traces">+ Yeni trace</Button>
          <Button variant="secondary" href="/guest-relations/traces?action=new-note">Not al</Button>
          <Button variant="ghost" href="/guest-relations?tab=messages">CRM mesajları</Button>
        </div>
      </div>
      <div className="roomio-gr-grid">
        {GUEST_RELATIONS_NAV.map((item) => (
          <Link key={item.id} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">
              {DESC[item.id] ?? item.shortcut ?? 'Misafir ilişkileri modülü'}
            </span>
          </Link>
        ))}
        {EXTRA_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
