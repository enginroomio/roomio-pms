'use client';

/** Elektra v5 screen-172 — statik yüksek sadakat mockup */
export function ElektraV5Mockup() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const occCurrent = [72, 68, 75, 81, 79, 84, 88, 85, 82, 78, 76, 80, 83, 86, 89, 87, 84, 81, 78, 74, 71, 69, 73, 77, 80, 83, 85, 82, 79, 76, 74];
  const occPrior = occCurrent.map((v) => Math.max(55, v - 12 + (v % 5)));

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--elektra">
      <div className="roomio-grafik-mockup__badge">Mockup · Elektra v5 — Detaylı Doluluk Grafiği</div>

      <div className="roomio-grafik-mockup__filterbar">
        <label>
          <span>Otel</span>
          <select defaultValue="ist"><option value="ist">Hotel Sapphire İstanbul</option></select>
        </label>
        <label>
          <span>Tarih Aralığı</span>
          <input readOnly value="01.06.2026 — 30.06.2026" />
        </label>
        <label>
          <span>Görünüm</span>
          <div className="roomio-grafik-mockup__seg">
            <button type="button" className="is-active">Gün</button>
            <button type="button">Hafta</button>
            <button type="button">Ay</button>
          </div>
        </label>
        <label>
          <span>Oda Tipi</span>
          <select defaultValue="all"><option value="all">Tümü</option></select>
        </label>
        <button type="button" className="roomio-grafik-mockup__report">Raporla</button>
        <button type="button" className="roomio-grafik-mockup__export">Dışa Aktar</button>
      </div>

      <div className="roomio-grafik-mockup__kpis">
        {[
          { label: 'Ortalama Doluluk %', value: '78,6', prior: '65,4', delta: '+13,2%', up: true },
          { label: 'Toplam Oda Gecelemesi', value: '1.917', prior: '1.595', delta: '+20,2%', up: true },
          { label: 'Toplam Müsait Oda Gecelemesi', value: '2.438', prior: '2.443', delta: '-0,2%', up: false },
          { label: 'Dolu Oda Gecelemesi', value: '1.917', prior: '1.595', delta: '+20,2%', up: true },
          { label: 'Müsait Oda Gecelemesi', value: '521', prior: '848', delta: '-38,5%', up: false },
        ].map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior">Geçen Yıl: {k.prior}</span>
            <span className={`roomio-grafik-mockup__kpi-delta${k.up ? ' is-up' : ' is-down'}`}>{k.delta}</span>
          </article>
        ))}
      </div>

      <section className="roomio-grafik-mockup__chart-block">
        <header>
          <h3>Günlük Doluluk Oranları (%)</h3>
          <div className="roomio-grafik-mockup__legend">
            <span><i className="line line--cur" /> Bu Yıl (%)</span>
            <span><i className="line line--prior" /> Geçen Yıl (%)</span>
          </div>
        </header>
        <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1="48" y1={220 - t * 1.7} x2="1080" y2={220 - t * 1.7} stroke="#e8edf2" />
              <text x="40" y={224 - t * 1.7} textAnchor="end" fill="#64748b" fontSize="11">{t}%</text>
            </g>
          ))}
          <rect x="700" y="24" width="380" height="196" fill="rgba(241,245,249,0.9)" />
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 4"
            points={occPrior.map((v, i) => `${48 + i * 34},${220 - v * 1.7}`).join(' ')}
          />
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            points={occCurrent.map((v, i) => `${48 + i * 34},${220 - v * 1.7}`).join(' ')}
          />
          {occCurrent.slice(0, 20).map((v, i) => (
            <text key={i} x={48 + i * 34} y={220 - v * 1.7 - 8} textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700">{v}</text>
          ))}
          {days.slice(0, 10).map((d, i) => (
            <text key={d} x={48 + i * 34} y="248" textAnchor="middle" fill="#64748b" fontSize="10">{String(d).padStart(2, '0')} Haz</text>
          ))}
        </svg>
      </section>

      <section className="roomio-grafik-mockup__chart-block">
        <header>
          <h3>Günlük Oda Gecelemeleri (Adet)</h3>
          <div className="roomio-grafik-mockup__legend">
            <span><i className="bar bar--booked" /> Dolu (Bu Yıl)</span>
            <span><i className="bar bar--avail" /> Müsait (Bu Yıl)</span>
            <span><i className="bar bar--prior" /> Geçen Yıl</span>
          </div>
        </header>
        <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
          {[0, 25, 50, 75, 100].map((t) => (
            <line key={t} x1="48" y1={220 - t * 1.7} x2="1080" y2={220 - t * 1.7} stroke="#e8edf2" />
          ))}
          <rect x="700" y="24" width="380" height="196" fill="rgba(241,245,249,0.9)" />
          {occCurrent.slice(0, 20).map((v, i) => {
            const booked = Math.round(v * 0.7);
            const avail = 100 - booked;
            const x = 48 + i * 34;
            return (
              <g key={i}>
                <rect x={x - 10} y={220 - avail * 1.7 - booked * 1.7} width="20" height={booked * 1.7} fill="#059669" rx="2" />
                <rect x={x - 10} y={220 - avail * 1.7} width="20" height={avail * 1.7} fill="#bbf7d0" rx="2" />
                <text x={x} y={220 - avail * 1.7 - booked * 1.7 - 6} textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700">{booked}</text>
              </g>
            );
          })}
        </svg>
      </section>

      <div className="roomio-grafik-mockup__info">
        Seçilen tarih aralığında geceleme bazlı doluluk ve oda gecelemesi dağılımı gösterilir. Tahmin bölgesi iş günü sonrasını içerir.
      </div>
    </div>
  );
}
