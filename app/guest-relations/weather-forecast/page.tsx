'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { WeatherPanel } from '@/components/guest-relations/WeatherPanel';

export default function WeatherForecastPage() {
  return (
    <GuestRelationsModuleShell
      segment="Hava Tahmini"
      title="5 Günlük Hava Tahmini"
      description="Misafir bilgilendirme — kısa dönem tahmin."
    >
      <WeatherPanel mode="forecast" />
    </GuestRelationsModuleShell>
  );
}
