'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestRelationsHubStats } from '@/components/guest-relations/GuestRelationsHubStats';
import { GrCrmMessagesPanel, GrDirectoryPanel } from '@/components/guest-relations/GrHubPanels';
import { MisafirIliskileriHubPanel } from '@/components/guest-relations/MisafirIliskileriHubPanel';
import { PageHeader } from '@/components/PageHeader';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

export default function GuestRelationsHubPageClient() {
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const tab = searchParams.get('tab');

  if (hub === 'misafir' && !tab) {
    return (
      <PageHeader
        breadcrumb="Misafir İlişkileri"
        title="Misafir İlişkileri Merkezi"
        description="Takip, aktivite, yorum ve VIP misafir yönetimi."
      >
        <GuestRelationsTabs />
        <GuestRelationsHubStats />
        <MisafirIliskileriHubPanel />
      </PageHeader>
    );
  }

  if (tab === 'messages') {
    return (
      <PageHeader breadcrumb="Misafir İlişkileri > CRM Mesajları" title="Online CRM Mesajları" description="Portal, WhatsApp ve e-posta kanallarından gelen misafir mesajları.">
        <GuestRelationsTabs />
        <GrCrmMessagesPanel />
      </PageHeader>
    );
  }

  if (tab === 'directory') {
    return (
      <PageHeader breadcrumb="Misafir İlişkileri > Rehber" title="Adres ve Tel Rehberi" description="Otel içi ve acil iletişim rehberi.">
        <GuestRelationsTabs />
        <GrDirectoryPanel />
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri"
      title="Misafir İlişkileri Özeti"
      description="Takip, aktivite, yorum ve VIP misafir yönetimi."
    >
      <GuestRelationsTabs />
      <GuestRelationsHubStats />
      <div className="roomio-gr-grid">
        {GUEST_RELATIONS_NAV.map((item) => (
          <Link key={item.id} href={item.href} className="roomio-card roomio-gr-card">
            <strong>{item.label}</strong>
            {item.shortcut ? <span className="roomio-page-desc">{item.shortcut}</span> : null}
          </Link>
        ))}
      </div>
    </PageHeader>
  );
}
