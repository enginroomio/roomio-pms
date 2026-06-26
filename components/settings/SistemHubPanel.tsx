'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

const LINKS = [
  { label: 'Kuruluş', href: '/settings', desc: 'Otel bilgileri, kullanıcılar, oda ve tarife tanımları' },
  { label: 'Rapor Tasarım', href: '/reports?tab=design', desc: 'Sürükle-bırak rapor şablon editörü' },
  { label: 'Form Tasarım', href: '/reports?tab=forms', desc: 'Rezervasyon ve form sihirbazı düzeni' },
  { label: 'Kullanıcı Raporları', href: '/reports?tab=user', desc: 'Kayıtlı şablonları çalıştır ve dışa aktar' },
  { label: 'Raporlama Programı', href: '/reports', desc: 'Kategori raporları ve yönetim özetleri' },
  { label: 'Servis Programları', href: '/settings/integrations', desc: 'Elektra entegrasyon merkezi' },
  { label: 'Sync Durumu', href: '/settings?section=sync', desc: 'Modül bağlantı ve canlı mod özeti' },
  { label: '5651 Hotspot', href: '/settings/compliance/5651', desc: 'MikroTik / UniFi oturum loglama' },
  { label: 'TESA Kapı Kartı', href: '/settings/integrations/tesa', desc: 'Check-in kart kodlama' },
  { label: 'Grandstream Santral', href: '/settings/integrations/pbx', desc: 'UCM6301 PMS API' },
  { label: 'Dil Tanımları', href: '/settings?section=language', desc: 'Tesis dilleri ve metin yönetimi' },
  { label: 'Form Metinleri', href: '/settings?section=lang-forms', desc: 'Rezervasyon formu çevirileri' },
  { label: 'Kayıt İzleme', href: '/tools/sistem?tab=sql', desc: 'Audit log ve SQL mesaj' },
  { label: 'Production Deploy', href: '/tools/deploy', desc: 'Go-live hazırlık kontrol listesi' },
] as const;

export function SistemHubPanel() {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20, marginBottom: 16 }}>
        <h2 className="roomio-card-title">Sistem ve kuruluş</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Elektra SİSTEM menüsü — kuruluş tanımları, rapor tasarım, entegrasyonlar ve uyumluluk.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/settings?section=users">Kullanıcılar</Button>
          <Button variant="ghost" href="/settings?section=config">Konfigürasyon</Button>
          <Button variant="ghost" href="/tools/pro">Profesyonel PMS merkezi</Button>
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
