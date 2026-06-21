import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { FilterWizardProMockup } from '@/components/reservations/graphic/mockups/FilterWizardProMockup';

export default function FilterWizardMockupPage() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon › Grafikler › Mockup #3 Filtre Sihirbazı"
      title="Elektra v5 Pro — Filtre Sihirbazı (Detaylı)"
      description="16 kategori · filtre kuyruğu · VE/VEYA · OB/BB/HB/FB · ülke/acenta/EGM/TIS/TGA · kayıtlı görünümler."
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/reservations/calendar/mockups">Galeri</Button>
          <Button href="/reservations/calendar">Grafikler F1</Button>
        </div>
      }
    >
      <FilterWizardProMockup />

      <div className="roomio-wizard-pro__spec">
        <h3>Mockup #3 özellik listesi</h3>
        <div className="roomio-wizard-pro__spec-grid">
          <div>
            <h4>Adım 1 — Kategori</h4>
            <ul>
              <li>5 grup: Pansiyon, Konaklama, Coğrafya, Kanal, Sistem</li>
              <li>16 filtre kategorisi + arama</li>
              <li>OB · BB · HB · FB · AI · UAI</li>
            </ul>
          </div>
          <div>
            <h4>Adım 2 — Koşul</h4>
            <ul>
              <li>7 operatör (Eşittir, İçinde, Arasında…)</li>
              <li>VE / VEYA birleştirme</li>
              <li>Çoklu ülke seçimi, pansiyon hızlı grid</li>
              <li>Kuyruğa ekle (çoklu filtre)</li>
            </ul>
          </div>
          <div>
            <h4>Adım 3 — Kaydet</h4>
            <ul>
              <li>Görünüm adı + paylaşım kapsamı</li>
              <li>Hedef: grafik, KPI, takvim, export</li>
              <li>Varsayılan açılış görünümü</li>
            </ul>
          </div>
          <div>
            <h4>Sağ panel</h4>
            <ul>
              <li>Canlı filtre kuyruğu</li>
              <li>Sorgu önizleme + etki tahmini</li>
              <li>Kayıtlı filtre setleri</li>
            </ul>
          </div>
        </div>
        <p>
          <Link href="/reservations/calendar">Elektra v5 Pro</Link>
          {' '}ekranından da sihirbazı açabilirsiniz.
        </p>
      </div>
    </PageHeader>
  );
}
