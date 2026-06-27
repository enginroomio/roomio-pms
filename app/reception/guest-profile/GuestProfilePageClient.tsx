'use client';

import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { GuestProfilePanel } from '@/components/reception/GuestProfilePanel';

export default function GuestProfilePageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Misafir Profili"
      title="Misafir Profil Kartı (360°)"
      description="Fidelio / Opera CRM — konaklama geçmişi, harcama ve ilişki özeti tek ekranda."
    >
      <ReceptionTabs />
      <GuestProfilePanel initialQuery={q} />
    </PageHeader>
  );
}
