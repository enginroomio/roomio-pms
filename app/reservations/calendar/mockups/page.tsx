import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

const LIVE_VIEWS = [
  {
    title: 'Elektra Forecast F1',
    desc: 'Canlı doluluk API — Grafik sekmesi, 31 gün sütun grafiği, EGM/TGA/TİS.',
    href: '/reservations/calendar',
  },
  {
    title: 'Filtre Sihirbazı Pro (#3)',
    desc: 'Kuyruk paneli, VE/VEYA mantığı, kayıtlı görünümler, grafik/KPI hedefleri.',
    href: '/reservations/calendar/mockups/filtre-sihirbazi',
  },
  {
    title: 'Canlı grafik (Pro)',
    desc: 'KPI şeridi, çizgi/sütun grafikleri, oda tipi matrisi — gerçek veri.',
    href: '/reservations/calendar',
    hint: 'Tasarım seçiciden «Canlı» sekmesi',
  },
  {
    title: 'Elektra v5 · Alt mockup',
    desc: 'Detaylı doluluk grafiği alternatifi.',
    href: '/reservations/calendar',
    hint: 'Tasarım seçiciden «Alt 1 · Elektra v5»',
  },
  {
    title: 'Takvim F1 · Alt mockup',
    desc: 'Aylık doluluk + gelir ısı haritası.',
    href: '/reservations/calendar',
    hint: 'Tasarım seçiciden «Alt 2 · Takvim F1»',
  },
];

export default function GrafikMockupGalleryPage() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon › Grafikler › İnteraktif Görünümler"
      title="Grafikler F1 — Canlı Ekranlar"
      description="PNG mockup arşivi kaldırıldı. Aşağıdaki linkler doğrudan çalışan UI bileşenlerine gider."
      actions={
        <Button href="/reservations/calendar">Forecast F1 (varsayılan)</Button>
      }
    >
      <div className="roomio-grafik-gallery">
        {LIVE_VIEWS.map((m) => (
          <article key={m.title} className="roomio-grafik-gallery__card roomio-grafik-gallery__card--live">
            <div className="roomio-grafik-gallery__body" style={{ padding: '16px 18px' }}>
              <h2>{m.title}</h2>
              <p>{m.desc}</p>
              {'hint' in m && m.hint ? <p className="roomio-page-desc">{m.hint}</p> : null}
              <div className="roomio-grafik-gallery__links">
                <Link href={m.href}>Ekranı aç</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageHeader>
  );
}
