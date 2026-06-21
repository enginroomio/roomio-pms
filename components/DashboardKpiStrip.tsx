import { Banknote, BedDouble, CalendarCheck, CalendarX, Percent } from 'lucide-react';
import { StatTile } from '@/components/kit';

type Props = {
  occupancy: number;
  arrivals: number;
  departures: number;
  inHouse: number;
  totalRooms: number;
};

export function DashboardKpiStrip({ occupancy, arrivals, departures, inHouse, totalRooms }: Props) {
  const items = [
    { label: 'Doluluk', value: `%${occupancy}`, hint: `${inHouse} / ${totalRooms} oda`, icon: Percent },
    { label: 'Giriş Bugün', value: String(arrivals), hint: 'Bekleyen check-in', icon: CalendarCheck },
    { label: 'Çıkış Bugün', value: String(departures), hint: 'Check-out planı', icon: CalendarX },
    { label: 'Konaklayan', value: String(inHouse), hint: 'In-house', icon: BedDouble },
    { label: 'Müsait', value: String(Math.max(0, totalRooms - inHouse)), hint: 'Boş oda', icon: Banknote },
  ];

  return (
    <section className="roomio-kpi-strip" aria-label="Günlük KPI">
      {items.map((item) => (
        <StatTile key={item.label} {...item} />
      ))}
    </section>
  );
}
