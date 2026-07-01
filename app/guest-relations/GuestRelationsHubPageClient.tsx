'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { GuestRelationsHubStats } from '@/components/guest-relations/GuestRelationsHubStats';
import { GrCrmMessagesPanel, GrDirectoryPanel } from '@/components/guest-relations/GrHubPanels';
import { MisafirIliskileriHubPanel } from '@/components/guest-relations/MisafirIliskileriHubPanel';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

export default function GuestRelationsHubPageClient() {
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const tab = searchParams.get('tab');

  if (hub === 'misafir' && !tab) {
    return (
      <GuestRelationsModuleShell
        segment="Merkezi"
        title="Misafir İlişkileri Merkezi"
        description="Takip, aktivite, yorum ve VIP misafir yönetimi."
      >
        <GuestRelationsHubStats />
        <MisafirIliskileriHubPanel />
      </GuestRelationsModuleShell>
    );
  }

  if (tab === 'messages') {
    return (
      <GuestRelationsModuleShell
        segment="CRM Mesajları"
        title="Online CRM Mesajları"
        description="Portal, WhatsApp ve e-posta kanallarından gelen misafir mesajları."
      >
        <GrCrmMessagesPanel />
      </GuestRelationsModuleShell>
    );
  }

  if (tab === 'directory') {
    return (
      <GuestRelationsModuleShell
        segment="Rehber"
        title="Adres ve Tel Rehberi"
        description="Otel içi ve acil iletişim rehberi."
      >
        <GrDirectoryPanel />
      </GuestRelationsModuleShell>
    );
  }

  return (
    <GuestRelationsModuleShell
      segment="Özet"
      title="Misafir İlişkileri Özeti"
      description="Takip, aktivite, yorum ve VIP misafir yönetimi."
    >
      <GuestRelationsHubStats />
      <div className="roomio-gr-grid">
        {GUEST_RELATIONS_NAV.map((item) => (
          <Link key={item.id} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            {item.shortcut ? <span className="roomio-page-desc">{item.shortcut}</span> : null}
          </Link>
        ))}
      </div>
    </GuestRelationsModuleShell>
  );
}
