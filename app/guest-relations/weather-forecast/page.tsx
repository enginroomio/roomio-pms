import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { WeatherPanel } from '@/components/guest-relations/WeatherPanel';
import { PageHeader } from '@/components/PageHeader';

export default function WeatherForecastPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Hava Tahmini" title="5 Günlük Hava Tahmini" description="Misafir bilgilendirme — kısa dönem tahmin.">
      <GuestRelationsTabs />
      <WeatherPanel mode="forecast" />
    </PageHeader>
  );
}
