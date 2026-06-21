'use client';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Elektra / screen-316 — aylık takvim doluluk + gelir mockup */
export function CalendarHeatmapMockup() {
  const juneDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const leading = 0;
  const cells: (number | null)[] = [...Array(leading).fill(null), ...juneDays];
  const revenue = (pct: number) => Math.round(85000 + pct * 420);

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--calendar">
      <div className="roomio-grafik-mockup__badge">Mockup · Takvim F1 — Aylık Doluluk & Gelir</div>

      <div className="roomio-grafik-mockup__cal-toolbar">
        <button type="button" aria-label="Önceki ay">‹</button>
        <strong>Haziran 2026</strong>
        <button type="button" aria-label="Sonraki ay">›</button>
        <div className="roomio-grafik-mockup__cal-actions">
          <button type="button">Excel&apos;e Aktar</button>
          <button type="button">Yazdır</button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__kpis roomio-grafik-mockup__kpis--4">
        {[
          { label: 'Ortalama Doluluk', value: '%68,4', hint: 'Geçen ay: %62,7 ↑5,7%' },
          { label: 'Toplam Oda Geliri', value: '₺2.845.600', hint: 'Geçen ay: ₺2.410.800 ↑18%' },
          { label: 'RevPAR', value: '₺1.023', hint: 'Geçen ay: ₺886 ↑15,5%' },
          { label: 'Müsait Oda', value: '2.480', hint: 'Geçen ay: 2.480 —' },
        ].map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi roomio-grafik-mockup__kpi--soft">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior">{k.hint}</span>
          </article>
        ))}
      </div>

      <div className="roomio-grafik-mockup__cal-legend">
        <span><i className="dot dot--occ" /> Doluluk %</span>
        <span><i className="dot dot--rev" /> Oda Geliri ₺</span>
        <div className="roomio-grafik-mockup__toggle">
          <button type="button" className="is-active">Yüzde</button>
          <button type="button">Değer</button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__cal-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="roomio-grafik-mockup__cal-weekday">{d}</div>
        ))}
        {cells.map((pct, i) => {
          if (pct == null) return <div key={`e-${i}`} className="roomio-grafik-mockup__cal-cell is-empty" />;
          const heat = pct >= 85 ? 'is-hot' : pct >= 70 ? 'is-mid' : 'is-low';
          const occ = 58 + ((pct * 7) % 35);
          return (
            <div key={`d-${i}`} className={`roomio-grafik-mockup__cal-cell ${heat}`}>
              <span className="roomio-grafik-mockup__cal-day">{pct}</span>
              <span className="roomio-grafik-mockup__cal-occ">%{occ.toFixed(1).replace('.', ',')}</span>
              <span className="roomio-grafik-mockup__cal-rev">₺{revenue(occ).toLocaleString('tr-TR')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
