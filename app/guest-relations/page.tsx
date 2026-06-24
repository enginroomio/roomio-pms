'use client';

import Link from 'next/link';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestRelationsHubStats } from '@/components/guest-relations/GuestRelationsHubStats';
import { PageHeader } from '@/components/PageHeader';
import { GUEST_RELATIONS_NAV } from '@/lib/navigation/guest-relations-nav';

export default function GuestRelationsHubPage() {
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
