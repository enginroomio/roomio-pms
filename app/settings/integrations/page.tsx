'use client';

import Link from 'next/link';
import { Anchor, Banknote, Bot, Building2, ClipboardCheck, Cloud, CreditCard, Dumbbell, Gamepad2, Headphones, Leaf, MessageCircle, Monitor, Package, Plane, ScanLine, ShoppingCart, Smartphone, Sparkles, Star, Ticket, Trophy, Truck, UtensilsCrossed, Users, FileText, Globe2, KeyRound, Phone, QrCode, Shield, TrendingUp, Wifi } from 'lucide-react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';

const INTEGRATIONS = [
  {
    id: 'booking-engine',
    title: 'Online Rezervasyon Motoru',
    description: 'Direkt web satışı, Sanal POS, Google Hotel ve trivago — komisyonsuz rezervasyon.',
    href: '/settings/integrations/booking-engine',
    icon: Globe2,
    status: 'Yeni',
  },
  {
    id: 'channel-manager',
    title: 'Kanal Yöneticisi',
    description: 'Booking, Expedia, Google Hotel ve tur operatörleri — iki yönlü fiyat, müsaitlik ve rezervasyon senkronu.',
    href: '/settings/integrations/channel-manager',
    icon: Globe2,
    status: 'Aktif',
  },
  {
    id: 'dynamic-pricing',
    title: 'Dinamik Fiyatlandırma',
    description: 'Doluluk ve lead-time kuralları — otomatik fiyat + kanal yöneticisi gönderimi.',
    href: '/settings/integrations/dynamic-pricing',
    icon: TrendingUp,
    status: 'Yeni',
  },
  {
    id: 'guest-portal',
    title: 'Misafir Portalı',
    description: 'QR check-in, folyo görüntüleme ve e-fatura talebi — self-servis misafir deneyimi.',
    href: '/settings/integrations/guest-portal',
    icon: QrCode,
    status: 'Yeni',
  },
  {
    id: 'efatura',
    title: 'e-Fatura / e-Arşiv',
    description: 'GİB entegrasyonu — fatura gönderimi, test ve canlı ortam.',
    href: '/settings/integrations/efatura',
    icon: FileText,
    status: 'Yeni',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp API',
    description: 'Rezervasyon onayı, check-in hatırlatma ve misafir mesajlaşması — Meta Cloud API.',
    href: '/settings/integrations/whatsapp',
    icon: MessageCircle,
    status: 'Yeni',
  },
  {
    id: 'kiosk',
    title: 'Check-in Kiosk',
    description: 'Lobi self check-in terminali — kimlik tarama ve oda kartı yazdırma.',
    href: '/settings/integrations/kiosk',
    icon: Monitor,
    status: 'Yeni',
  },
  {
    id: 'loyalty',
    title: 'Sadakat & Acente Bonus',
    description: 'Misafir puanları, kademe indirimleri ve acente komisyon bonusları.',
    href: '/settings/integrations/loyalty',
    icon: Trophy,
    status: 'Yeni',
  },
  {
    id: 'spa',
    title: 'SPA Yönetimi',
    description: 'Tedavi kataloğu, randevu takvimi ve online rezervasyon.',
    href: '/settings/integrations/spa',
    icon: Sparkles,
    status: 'Yeni',
  },
  {
    id: 'digital-menu',
    title: 'Akıllı Dijital Menü',
    description: 'QR masa menüsü, alerjen bilgisi ve mutfak sipariş entegrasyonu.',
    href: '/settings/integrations/digital-menu',
    icon: UtensilsCrossed,
    status: 'Yeni',
  },
  {
    id: 'reputation',
    title: 'İtibar Yönetimi',
    description: 'Booking, Google ve TripAdvisor yorumlarını tek panelde toplayın.',
    href: '/settings/integrations/reputation',
    icon: Star,
    status: 'Yeni',
  },
  {
    id: 'banking',
    title: 'Banka Entegrasyonları',
    description: 'Hesap bakiyeleri ve otomatik mutabakat.',
    href: '/settings/integrations/banking',
    icon: Banknote,
    status: 'Yeni',
  },
  {
    id: 'call-center',
    title: 'Çağrı Merkezi',
    description: 'Rezervasyon kuyruğu, PBX entegrasyonu ve upsell senaryoları.',
    href: '/settings/integrations/call-center',
    icon: Headphones,
    status: 'Yeni',
  },
  {
    id: 'tour-operator',
    title: 'Tur Operatörü',
    description: 'TUI, Anex, ETS — allotment kontenjanı ve manifest senkronu.',
    href: '/settings/integrations/tour-operator',
    icon: Plane,
    status: 'Yeni',
  },
  {
    id: 'viofun',
    title: 'Viofun',
    description: 'Otel aktiviteleri, su sporları ve eğlence rezervasyon platformu.',
    href: '/settings/integrations/viofun',
    icon: Gamepad2,
    status: 'Yeni',
  },
  {
    id: 'guest-app',
    title: 'Misafir Uygulaması',
    description: 'Native iOS/Android app — deep link, push ve özellik bayrakları.',
    href: '/settings/integrations/guest-app',
    icon: Smartphone,
    status: 'Yeni',
  },
  {
    id: 'ai-assistant',
    title: 'Otel AI Asistan',
    description: 'Misafir ve personel için yapay zeka destekli sohbet asistanı.',
    href: '/settings/integrations/ai-assistant',
    icon: Bot,
    status: 'Yeni',
  },
  {
    id: 'marina',
    title: 'Marina Yönetimi',
    description: 'Rıhtım envanteri, tekne bağlama ve online rezervasyon.',
    href: '/settings/integrations/marina',
    icon: Anchor,
    status: 'Yeni',
  },
  {
    id: 'hr-portal',
    title: 'IK Portal',
    description: 'Personel mobil uygulaması — izin, vardiya, bordro ve eğitim.',
    href: '/settings/integrations/hr-portal',
    icon: Users,
    status: 'Yeni',
  },
  {
    id: 'supplier-portal',
    title: 'Tedarik Portalı',
    description: 'Tedarikçi siparişleri, onay akışı ve düşük stok bildirimleri.',
    href: '/settings/integrations/supplier-portal',
    icon: Truck,
    status: 'Yeni',
  },
  {
    id: 'inventory',
    title: 'Stok Takip',
    description: 'Depo envanteri, reçete, maliyet analizi ve zayi takibi.',
    href: '/settings/integrations/inventory',
    icon: Package,
    status: 'Yeni',
  },
  {
    id: 'restaurant-booking',
    title: 'Restoran Online Rezervasyon',
    description: 'Masa rezervasyonu — otel restoranı ve bağımsız işletmeler.',
    href: '/settings/integrations/restaurant-booking',
    icon: UtensilsCrossed,
    status: 'Yeni',
  },
  {
    id: 'virtual-pos',
    title: 'Sanal POS',
    description: 'Online ödeme tahsilatı — 3D Secure ve taksit desteği.',
    href: '/settings/integrations/virtual-pos',
    icon: CreditCard,
    status: 'Yeni',
  },
  {
    id: 'lite-mobile',
    title: 'Lite Mobile',
    description: 'Personel mobil operasyon — HK, bakım, misafir talepleri.',
    href: '/settings/integrations/lite-mobile',
    icon: Smartphone,
    status: 'Yeni',
  },
  {
    id: 'quality',
    title: 'Kalite Yönetimi',
    description: 'ISO doküman yönetimi, denetim ve prosedür takibi.',
    href: '/settings/integrations/quality',
    icon: ClipboardCheck,
    status: 'Yeni',
  },
  {
    id: 'carbon',
    title: 'Karbon Dengeleme',
    description: 'Karbon ayak izi hesaplama ve offset sertifikası.',
    href: '/settings/integrations/carbon',
    icon: Leaf,
    status: 'Yeni',
  },
  {
    id: 'fair-events',
    title: 'Fuar Otomasyon',
    description: 'Fuar ve sempozyum dijital kayıt, QR check-in.',
    href: '/settings/integrations/fair-events',
    icon: Ticket,
    status: 'Yeni',
  },
  {
    id: 'google-backup',
    title: 'Google BigQuery Yedekleme',
    description: 'Otel verilerinin Google Cloud BigQuery üzerinde yedeklenmesi.',
    href: '/settings/integrations/google-backup',
    icon: Cloud,
    status: 'Yeni',
  },
  {
    id: 'fixed-assets',
    title: 'Demirbaş Yönetimi',
    description: 'Sabit kıymet envanteri, amortisman ve denetim.',
    href: '/settings/integrations/fixed-assets',
    icon: Building2,
    status: 'Yeni',
  },
  {
    id: 'procurement',
    title: 'Satın Alma',
    description: 'Departman talepleri, onay akışı ve tedarik yönlendirme.',
    href: '/settings/integrations/procurement',
    icon: ShoppingCart,
    status: 'Yeni',
  },
  {
    id: 'website-builder',
    title: 'Web Sitesi',
    description: 'Otel web sitesi tasarımı — rezervasyon motoru entegrasyonu.',
    href: '/settings/integrations/website-builder',
    icon: Globe2,
    status: 'Yeni',
  },
  {
    id: 'gym',
    title: 'Spor Salonu',
    description: 'Fitness merkezi, grup dersleri ve online rezervasyon.',
    href: '/settings/integrations/gym',
    icon: Dumbbell,
    status: 'Yeni',
  },
  {
    id: 'e-dispatch',
    title: 'e-İrsaliye',
    description: 'GİB uyumlu e-İrsaliye gönderimi.',
    href: '/settings/integrations/e-dispatch',
    icon: Truck,
    status: 'Yeni',
  },
  {
    id: 'id-reader',
    title: 'Kimlik Okuyucu',
    description: 'Kimlikokur pasaport/kimlik tarama — check-in otomatik doldurma.',
    href: '/settings/integrations/id-reader',
    icon: ScanLine,
    status: 'Yeni',
  },
  {
    id: 'egm',
    title: 'EGM / KBS Kimlik Bildirimi',
    description: 'Konaklama kimlik bildirimi — check-in, rezervasyon ve 5651 uyumu.',
    href: '/settings/integrations/egm',
    icon: ScanLine,
    status: 'Aktif',
  },
  {
    id: 'tesa',
    title: 'TESA Hospitality 7.04.03',
    description: 'HT24 PMS Service — oda kartı encode, check-out ve kopya kart (TCP 7779).',
    href: '/settings/integrations/tesa',
    icon: KeyRound,
    status: 'Aktif',
  },
  {
    id: 'pbx',
    title: 'Grandstream UCM6301 Santral',
    description: 'HTTPS API + PMS API — check-in/out, oda durumu, uyandırma (port 8089).',
    href: '/settings/integrations/pbx',
    icon: Phone,
    status: 'Aktif',
  },
  {
    id: '5651',
    title: '5651 Hotspot Loglama',
    description: 'BTK uyumlu misafir WiFi trafik kayıtları, saklama ve denetim dışa aktarımı.',
    href: '/settings/compliance/5651',
    icon: Wifi,
    status: 'Aktif',
  },
  {
    id: 'kvkk',
    title: 'KVKK & Denetim',
    description: 'Kişisel veri politikaları, onay kayıtları ve erişim günlüğü.',
    href: '/settings/privacy',
    icon: Shield,
    status: 'Aktif',
  },
];

const CORE_INTEGRATION_IDS = new Set(['egm', 'tesa', 'pbx', '5651']);

const ORDERED_INTEGRATIONS = [
  ...INTEGRATIONS.filter((item) => CORE_INTEGRATION_IDS.has(item.id)),
  ...INTEGRATIONS.filter((item) => !CORE_INTEGRATION_IDS.has(item.id)),
];

export default function IntegrationsHubPage() {
  return (
    <ModuleLayout
      breadcrumb="Sistem › Entegrasyonlar"
      title="Servis Programları & Entegrasyonlar"
      description="TESA kapı sistemi, Grandstream santral, 5651 hotspot uyumluluğu ve yasal modüller."
      sideTitle="Entegrasyon"
      actions={<Button variant="ghost" href="/settings">← Kuruluş</Button>}
    >
      <div className="roomio-integration-grid">
        {ORDERED_INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="roomio-integration-card">
              <div className="roomio-integration-card__icon">
                <Icon size={22} />
              </div>
              <div>
                <div className="roomio-integration-card__head">
                  <h2>{item.title}</h2>
                  <span className="roomio-badge roomio-badge--accent">{item.status}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        <Link href="/tools/rollout?phase=sistem">Rollout test</Link>
        {' · '}
        <Link href="/settings/integrations/tesa">TESA ayarları</Link>
        {' · '}
        <Link href="/settings/integrations/pbx">Grandstream santral</Link>
        {' · '}
        <Link href="/settings/integrations/pbx">Grandstream santral</Link>
      </p>
    </ModuleLayout>
  );
}
