import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { WEATHER_TODAY } from '@/lib/data/guest-relations';

export default function WeatherPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Günlük Hava Durumu" title="Günlük Hava Durumu" description="Misafir bilgilendirme — günlük hava özeti.">
      <GuestRelationsTabs />
      <div className="roomio-card">
        <dl className="roomio-dl">
          <dt>Şehir</dt><dd>{WEATHER_TODAY.city}</dd>
          <dt>Tarih</dt><dd>{WEATHER_TODAY.date}</dd>
          <dt>Sıcaklık</dt><dd>{WEATHER_TODAY.temp}</dd>
          <dt>Durum</dt><dd>{WEATHER_TODAY.condition}</dd>
          <dt>Nem</dt><dd>{WEATHER_TODAY.humidity}</dd>
          <dt>Rüzgar</dt><dd>{WEATHER_TODAY.wind}</dd>
        </dl>
      </div>
    </PageHeader>
  );
}
