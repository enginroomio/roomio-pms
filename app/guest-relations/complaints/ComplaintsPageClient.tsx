'use client';

import { useSearchParams } from 'next/navigation';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestComplaintsPanel } from '@/components/guest-relations/GuestComplaintsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function ComplaintsPageClient() {
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';

  return (
    <PageHeader
      breadcrumb={`Misafir İlişkileri > ${isNew ? 'Yeni Arıza / Şikayet' : 'Arıza ve Şikayet Listesi'}`}
      title={isNew ? 'Yeni Arıza ve Şikayet Kaydı' : 'Arıza ve Şikayet Listesi'}
      description="Misafir şikayetleri ve teknik arıza kayıtları."
    >
      <GuestRelationsTabs />
      <GuestComplaintsPanel autoOpenForm={isNew} />
    </PageHeader>
  );
}
