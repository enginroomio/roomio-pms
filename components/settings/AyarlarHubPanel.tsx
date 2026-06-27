'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';

const QUICK_LINKS = [
  { label: 'Şifre Değiştir', href: '/settings?tab=password', desc: 'Hesap güvenliği ve zorunlu şifre yenileme' },
  { label: 'Tema Seç', href: '/settings?tab=theme', desc: 'Açık, koyu ve klasik Roomio temaları' },
  { label: 'Not Al / Traces', href: '/guest-relations/traces?action=new-note', desc: 'Misafir notları ve uyandırma kayıtları' },
  { label: 'CRM Mesajları', href: '/guest-relations?tab=messages', desc: 'Portal, WhatsApp ve e-posta mesajları' },
  { label: 'Adres Rehberi', href: '/guest-relations?tab=directory', desc: 'Otel içi ve acil iletişim' },
  { label: 'Santral', href: '/settings/integrations/pbx', desc: 'Grandstream UCM6301 yapılandırması' },
  { label: 'Çağrı Kayıtları', href: '/settings?section=pbx-calls', desc: 'Günlük CDR listesi' },
  { label: 'Misafir Eşleştirme', href: '/settings?section=pbx-lookup', desc: 'Oda ↔ dahili arama' },
  { label: 'KVKK & Gizlilik', href: '/settings/privacy', desc: 'Log izleme ve veri maskeleme' },
  { label: 'Lisanslama', href: '/settings/licensing', desc: 'Modül ve oda limiti doğrulama' },
  { label: 'Kapı Kartı (TESA)', href: '/settings/integrations/tesa', desc: 'Check-in kart kodlama' },
  { label: 'Entegrasyonlar', href: '/settings/integrations', desc: 'Elektra modül hub' },
] as const;

export function AyarlarHubPanel() {
  const { logout } = useSession();

  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Ayarlar ve kısayollar</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Elektra AYARLAR menüsündeki işlemler — tema, güvenlik, notlar, santral ve lisans.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" onClick={() => void logout()}>Sistemden çıkış</Button>
          <Button variant="ghost" href="/settings?section=users">Kullanıcı tanımları</Button>
        </div>
      </div>

      <div className="roomio-gr-grid">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            <span className="roomio-page-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
