'use client';

import { useProperty } from '@/components/property/PropertyProvider';
import { usePropertyPortfolio } from '@/lib/client/use-property-portfolio';

export function PropertyPortfolioStrip() {
  const { propertyId, setPropertyId } = useProperty();
  const { data, loading } = usePropertyPortfolio();

  if (loading && !data) {
    return <p className="roomio-page-desc" style={{ marginTop: 12 }}>Şube portföyü yükleniyor…</p>;
  }
  if (!data || data.properties.length <= 1) return null;

  return (
    <section className="roomio-card roomio-portfolio-strip" style={{ marginTop: 12 }} aria-label="Çoklu şube özeti">
      <div className="roomio-card-head-row">
        <h2 className="roomio-card-title">Şube portföyü</h2>
        <span className="roomio-page-desc">
          {data.totals.properties} tesis · {data.totals.checkedIn} konaklayan
        </span>
      </div>
      <div className="roomio-portfolio-grid">
        {data.properties.map((p) => {
          const active = p.propertyId === propertyId;
          return (
            <button
              key={p.propertyId}
              type="button"
              className={`roomio-portfolio-card${active ? ' is-active' : ''}`}
              onClick={() => setPropertyId(p.propertyId)}
            >
              <strong>{p.name}</strong>
              <span>{p.city ?? p.code}</span>
              <span className="roomio-portfolio-kpi">
                %{p.occupancyPct} doluluk · {p.checkedIn}/{p.totalRooms} oda
              </span>
              <span className="roomio-portfolio-kpi">Bugün giriş: {p.arrivalsToday}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
