'use client';

import { useSearchParams } from 'next/navigation';
import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { GuestComplaintsPanel } from '@/components/guest-relations/GuestComplaintsPanel';

export default function ComplaintsPageClient() {
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === '1';

  return (
    <GuestRelationsModuleShell
      segment={isNew ? 'Yeni Arıza / Şikayet' : 'Arıza ve Şikayet'}
      title={isNew ? 'Yeni Arıza ve Şikayet Kaydı' : 'Arıza ve Şikayet Listesi'}
      description="Misafir şikayetleri ve teknik arıza kayıtları."
    >
      <GuestComplaintsPanel autoOpenForm={isNew} />
    </GuestRelationsModuleShell>
  );
}
