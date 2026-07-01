'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { WeatherPanel } from '@/components/guest-relations/WeatherPanel';

export default function WeatherPage() {
  return (
    <GuestRelationsModuleShell
      segment="Günlük Hava Durumu"
      title="Günlük Hava Durumu"
      description="Misafir bilgilendirme — günlük hava özeti."
    >
      <WeatherPanel mode="today" />
    </GuestRelationsModuleShell>
  );
}
