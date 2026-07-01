'use client';

import { useSearchParams } from 'next/navigation';
import { ReceptionModuleShell } from '@/components/reception/ReceptionModuleShell';
import { GuestProfilePanel } from '@/components/reception/GuestProfilePanel';

export default function GuestProfilePageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  return (
    <ReceptionModuleShell
      segment="Misafir Profili"
      title="Misafir Profil Kartı (360°)"
      description="Fidelio / Opera CRM — konaklama geçmişi, harcama ve ilişki özeti tek ekranda."
    >
      <GuestProfilePanel initialQuery={q} />
    </ReceptionModuleShell>
  );
}
