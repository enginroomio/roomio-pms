'use client';

import Link from 'next/link';
import { KeyRound, Phone, Shield, Wifi } from 'lucide-react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';

const INTEGRATIONS = [
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
        {INTEGRATIONS.map((item) => {
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
      </p>
    </ModuleLayout>
  );
}
