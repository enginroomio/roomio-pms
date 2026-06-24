import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { WeatherPanel } from '@/components/guest-relations/WeatherPanel';
import { PageHeader } from '@/components/PageHeader';

export default function WeatherPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Günlük Hava Durumu" title="Günlük Hava Durumu" description="Misafir bilgilendirme — günlük hava özeti.">
      <GuestRelationsTabs />
      <WeatherPanel mode="today" />
    </PageHeader>
  );
}
