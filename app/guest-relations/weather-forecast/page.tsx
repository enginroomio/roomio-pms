import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { WEATHER_FORECAST } from '@/lib/data/guest-relations';

export default function WeatherForecastPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > 5 Günlük Hava Tahmini" title="5 Günlük Hava Tahmini" description="Misafir ilişkileri hava bilgilendirme paneli.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Gün</th><th>Yüksek</th><th>Düşük</th><th>Durum</th></tr></thead>
          <tbody>{WEATHER_FORECAST.map((r) => <tr key={r.day}><td>{r.day}</td><td>{r.high}°C</td><td>{r.low}°C</td><td>{r.condition}</td></tr>)}</tbody>
        </table>
      </div>
    </PageHeader>
  );
}
