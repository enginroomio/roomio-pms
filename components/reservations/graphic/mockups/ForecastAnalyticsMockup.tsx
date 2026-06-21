'use client';

import { useState } from 'react';

const TABS = ['Özet', 'Oda Tipi', 'Günlük', 'Geliş', 'Gelir', 'Pazar Segmenti'];

/** screen-317 — forecast analiz + combo chart mockup */
export function ForecastAnalyticsMockup() {
  const [tab, setTab] = useState('Geliş');
  const bars = [42, 38, 55, 48, 62, 58, 71, 65, 78, 72, 68, 74, 81, 76];

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--forecast">
      <div className="roomio-grafik-mockup__badge">Mockup · Forecast — Doluluk Grafik & Analiz</div>

      <div className="roomio-grafik-mockup__forecast-head">
        <div>
          <h2>Doluluk Grafik ve Analizleri</h2>
          <p>01 Haz 2026 — 30 Haz 2026</p>
        </div>
        <div className="roomio-grafik-mockup__forecast-actions">
          <button type="button">Filtrele</button>
          <button type="button" className="is-primary">Excel&apos;e Aktar</button>
        </div>
      </div>

      <div className="roomio-grafik-mockup__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'is-active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="roomio-grafik-mockup__kpis roomio-grafik-mockup__kpis--4">
        {[
          { label: 'Toplam Geliş', value: '1.248', hint: '+12,4% geçmiş dönem' },
          { label: 'Toplam Misafir', value: '2.318', hint: '+10,1% geçmiş dönem' },
          { label: 'Ort. Kalış', value: '1,86 gece', hint: '+3,2% geçmiş dönem' },
          { label: 'Geliş Başına Gelir', value: '₺112,74', hint: '+8,7% geçmiş dönem' },
        ].map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi roomio-grafik-mockup__kpi--soft">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior is-up">{k.hint}</span>
          </article>
        ))}
      </div>

      <div className="roomio-grafik-mockup__forecast-body">
        <section className="roomio-grafik-mockup__chart-block roomio-grafik-mockup__chart-block--wide">
          <header>
            <h3>Günlük Geliş Sayısı — {tab}</h3>
            <div className="roomio-grafik-mockup__legend">
              <span><i className="bar bar--booked" /> Bu Dönem</span>
              <span><i className="bar bar--prior" /> Geçmiş Dönem</span>
              <span><i className="line line--prior" /> Geçen Yıl</span>
            </div>
          </header>
          <svg viewBox="0 0 800 220" className="roomio-grafik-mockup__svg" aria-hidden>
            {bars.map((v, i) => {
              const x = 40 + i * 52;
              const h = v * 2.2;
              return (
                <g key={i}>
                  <rect x={x} y={180 - h * 0.85} width="18" height={h * 0.85} fill="#bae6fd" rx="2" />
                  <rect x={x + 4} y={180 - h} width="18" height={h} fill="#0f766e" rx="2" />
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                    points={`${x + 12},${180 - h - 12} ${x + 28},${180 - h * 0.7 - 8}`}
                  />
                </g>
              );
            })}
          </svg>
        </section>

        <aside className="roomio-grafik-mockup__side">
          <h4>Dönem Özeti</h4>
          <dl>
            <div><dt>Toplam Geliş</dt><dd>1.248</dd></div>
            <div><dt>Geçmiş Dönem</dt><dd>1.110</dd></div>
            <div><dt>Geçen Yıl</dt><dd>1.063</dd></div>
            <div><dt>Değişim (GD)</dt><dd className="is-up">↑ %12,4</dd></div>
            <div><dt>En Yüksek</dt><dd>15 Haz (98)</dd></div>
            <div><dt>En Düşük</dt><dd>02 Haz (24)</dd></div>
          </dl>
        </aside>
      </div>

      <table className="roomio-grafik-mockup__table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Bu Dönem</th>
            <th>Geçmiş Dönem</th>
            <th>Geçen Yıl</th>
            <th>Değişim (GD)</th>
            <th>Değişim (GY)</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['01 Haz Cmt', 42, 38, 35, '+10,5%', '+20,0%'],
            ['02 Haz Paz', 24, 28, 22, '-14,3%', '+9,1%'],
            ['03 Haz Pzt', 55, 48, 44, '+14,6%', '+25,0%'],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((cell, ci) => (
                <td key={ci} className={ci >= 4 ? (String(cell).startsWith('+') ? 'is-up' : 'is-down') : ''}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
