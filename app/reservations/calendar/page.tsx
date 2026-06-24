import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationCalendarContent } from './ReservationCalendarContent';

export const dynamic = 'force-dynamic';

export default function ReservationCalendarPage() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon › Grafikler (F1)"
      title="Grafikler"
      description="Elektra v5 Forecast — canlı doluluk API, Grafik sekmesi, EGM/TGA/TİS sekmeleri, günlük kurlar."
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/reservations/calendar/mockups">İnteraktif galeri</Button>
          <Button variant="secondary" href="/reservations">Rezervasyon Listesi</Button>
          <Button href="/reservations/new">+ Yeni (F2)</Button>
        </div>
      }
    >
      <ReservationCalendarContent />
    </PageHeader>
  );
}
