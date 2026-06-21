'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { GraphicFilterWizard, type WizardFilter } from './GraphicFilterWizard';
import { linePath } from '@/lib/reservations/graphic-calendar';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const BOARD_TYPES = ['Tümü', 'OB', 'BB', 'HB', 'FB', 'AI', 'UAI'] as const;

type Dimension = 'genel' | 'egm' | 'tis' | 'tga';

const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: 'genel', label: 'Genel' },
  { id: 'egm', label: 'EGM' },
  { id: 'tis', label: 'TIS' },
  { id: 'tga', label: 'TGA' },
];

const BASE_FILTERS: WizardFilter[] = [
  { id: 'f1', category: 'Otel', label: 'Hotel Sapphire İstanbul', tone: 'blue' },
  { id: 'f2', category: 'Pansiyon Tipi', label: 'HB (Half Board)', tone: 'amber' },
  { id: 'f3', category: 'Ülke', label: 'Tümü', tone: 'indigo' },
  { id: 'f4', category: 'Acenta', label: 'Tümü', tone: 'violet' },
];

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function demoRoomOcc(day: number) {
  return Math.min(98, 58 + ((day * 13) % 35));
}

function demoPaxOcc(day: number) {
  return Math.min(100, demoRoomOcc(day) + 4 + (day % 7));
}

function demoDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Elektra v5 tam mockup — oda + kişi doluluğu, geniş filtreler */
export function ElektraFullGraphicsMockup() {
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(2026);
  const [dimension, setDimension] = useState<Dimension>('genel');
  const [board, setBoard] = useState<(typeof BOARD_TYPES)[number]>('Tümü');
  const [filters, setFilters] = useState<WizardFilter[]>(BASE_FILTERS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'gun' | 'hafta' | 'ay'>('ay');

  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const monthLabel = `${MONTHS_TR[month]} ${year}`;
  const daysCount = demoDaysInMonth(year, month);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const chartDays = Array.from({ length: Math.min(daysCount, 31) }, (_, i) => i + 1);
  const roomLine = chartDays.map((d, i) => {
    const v = demoRoomOcc(d);
    return { x: 48 + i * 34, y: 220 - v * 1.7, v };
  });
  const paxLine = chartDays.map((d, i) => {
    const v = demoPaxOcc(d);
    return { x: 48 + i * 34, y: 220 - v * 1.7, v };
  });
  const priorRoom = chartDays.map((d, i) => {
    const v = Math.max(40, demoRoomOcc(d) - 12 + (i % 4));
    return { x: 48 + i * 34, y: 220 - v * 1.7 };
  });

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--elektra-full">
      <div className="roomio-grafik-mockup__badge">Elektra v5 Mockup · Oda + Kişi Doluluğu · Geniş Filtre Sihirbazı</div>

      {/* Elektra filtre barı */}
      <div className="roomio-grafik-elektra__filterbar">
        <label><span>Otel</span><select defaultValue="ist"><option>Hotel Sapphire İstanbul</option></select></label>
        <label><span>Tarih aralığı</span><input readOnly value={`01.${String(month + 1).padStart(2, '0')}.${year} — ${daysCount}.${String(month + 1).padStart(2, '0')}.${year}`} /></label>
        <label>
          <span>Görünüm</span>
          <div className="roomio-grafik-mockup__seg">
            <button type="button" className={viewMode === 'gun' ? 'is-active' : ''} onClick={() => setViewMode('gun')}>Gün</button>
            <button type="button" className={viewMode === 'hafta' ? 'is-active' : ''} onClick={() => setViewMode('hafta')}>Hafta</button>
            <button type="button" className={viewMode === 'ay' ? 'is-active' : ''} onClick={() => setViewMode('ay')}>Ay</button>
          </div>
        </label>
        <label><span>Oda tipi</span><select defaultValue="all"><option value="all">Tümü</option><option>DBL</option><option>SUI</option></select></label>
        <label>
          <span>Pansiyon</span>
          <select value={board} onChange={(e) => setBoard(e.target.value as (typeof BOARD_TYPES)[number])}>
            {BOARD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </label>
        <label><span>Ülke</span><select defaultValue="all"><option value="all">Tümü</option><option>Türkiye</option><option>Almanya</option><option>Rusya</option></select></label>
        <label><span>Acenta</span><select defaultValue="all"><option value="all">Tümü</option><option>Direct</option><option>Booking</option><option>TUI</option></select></label>
        <button type="button" className="roomio-grafik-mockup__report">Raporla</button>
        <button type="button" className="roomio-grafik-mockup__export">Dışa Aktar</button>
      </div>

      {/* Ay navigasyonu + boyut + sihirbaz */}
      <div className="roomio-grafik-elektra__subbar">
        <div className="roomio-grafik-monthly__month-nav">
          <button type="button" aria-label="Önceki ay" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></button>
          <strong>{monthLabel}</strong>
          <button type="button" aria-label="Sonraki ay" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></button>
        </div>
        <div className="roomio-grafik-elektra__dims">
          {DIMENSIONS.map((d) => (
            <button key={d.id} type="button" className={dimension === d.id ? 'is-active' : ''} onClick={() => setDimension(d.id)}>{d.label}</button>
          ))}
        </div>
        <button type="button" className="roomio-grafik-monthly__wizard-btn" onClick={() => setWizardOpen(true)}>
          <SlidersHorizontal size={16} /> Geniş Filtre Sihirbazı
        </button>
      </div>

      <div className="roomio-grafik-monthly__chips">
        {filters.map((f) => (
          <span key={f.id} className={`roomio-grafik-monthly__chip tone-${f.tone}`}>
            <em>{f.category}</em> {f.label}
            <button type="button" aria-label="Kaldır" onClick={() => setFilters((p) => p.filter((x) => x.id !== f.id))}><X size={12} /></button>
          </span>
        ))}
        <button type="button" className="roomio-grafik-monthly__chip-add" onClick={() => setWizardOpen(true)}><Plus size={12} /> Filtre ekle</button>
      </div>

      {/* Elektra KPI — oda + kişi */}
      <div className="roomio-grafik-mockup__kpis roomio-grafik-elektra__kpis">
        {[
          { label: 'Ort. Oda Doluluğu %', value: '78,6', prior: '65,4', delta: '+13,2%', up: true },
          { label: 'Ort. Kişi Doluluğu %', value: '82,4', prior: '68,1', delta: '+14,3%', up: true },
          { label: 'Toplam Oda Gecelemesi', value: '1.917', prior: '1.595', delta: '+20,2%', up: true },
          { label: 'Toplam Kişi Gecelemesi', value: '4.238', prior: '3.512', delta: '+20,7%', up: true },
          { label: 'Müsait Oda Gecelemesi', value: '521', prior: '848', delta: '-38,5%', up: false },
          { label: 'RevPAR', value: '₺1.023', prior: '₺886', delta: '+15,5%', up: true },
        ].map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className="roomio-grafik-mockup__kpi-prior">Geçen yıl: {k.prior}</span>
            <span className={`roomio-grafik-mockup__kpi-delta${k.up ? ' is-up' : ' is-down'}`}>{k.delta}</span>
          </article>
        ))}
      </div>

      {/* Çizgi grafik — oda + kişi aynı anda */}
      <section className="roomio-grafik-mockup__chart-block">
        <header>
          <h3>Günlük Doluluk Oranları — Oda & Kişi (%)</h3>
          <div className="roomio-grafik-mockup__legend">
            <span><i className="line line--room" /> Oda (bu yıl)</span>
            <span><i className="line line--pax" /> Kişi (bu yıl)</span>
            <span><i className="line line--prior" /> Oda (geçen yıl)</span>
          </div>
        </header>
        <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1="48" y1={220 - t * 1.7} x2="1080" y2={220 - t * 1.7} stroke="#e8edf2" />
              <text x="40" y={224 - t * 1.7} textAnchor="end" fill="#64748b" fontSize="11">{t}%</text>
            </g>
          ))}
          <rect x="680" y="24" width="400" height="196" fill="rgba(241,245,249,0.85)" />
          <path d={linePath(priorRoom)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
          <path d={linePath(roomLine)} fill="none" stroke="#059669" strokeWidth="2.5" />
          <path d={linePath(paxLine)} fill="none" stroke="#7c3aed" strokeWidth="2.5" />
          {roomLine.slice(0, 20).map((p, i) => (
            <g key={i}>
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#065f46" fontSize="9" fontWeight="700">O{p.v}</text>
              <text x={paxLine[i]?.x ?? p.x} y={(paxLine[i]?.y ?? p.y) - 22} textAnchor="middle" fill="#5b21b6" fontSize="9" fontWeight="700">K{paxLine[i]?.v}</text>
            </g>
          ))}
        </svg>
      </section>

      {/* Sütun grafik — oda + kişi geceleme */}
      <section className="roomio-grafik-mockup__chart-block">
        <header>
          <h3>Günlük Gecelemeler — Oda & Kişi (Adet)</h3>
          <div className="roomio-grafik-mockup__legend">
            <span><i className="bar bar--booked" /> Dolu oda</span>
            <span><i className="bar bar--pax" /> Kişi geceleme</span>
            <span><i className="bar bar--avail" /> Müsait oda</span>
          </div>
        </header>
        <svg viewBox="0 0 1100 260" className="roomio-grafik-mockup__svg" aria-hidden>
          {chartDays.slice(0, 20).map((d, i) => {
            const roomBooked = Math.round(demoRoomOcc(d) * 0.7);
            const paxNights = Math.round(roomBooked * 2.2);
            const avail = 100 - roomBooked;
            const x = 48 + i * 34;
            return (
              <g key={d}>
                <rect x={x - 12} y={220 - avail * 1.7 - roomBooked * 1.7} width="10" height={roomBooked * 1.7} fill="#059669" rx="2" />
                <rect x={x + 2} y={220 - (paxNights / 3) * 1.7} width="10" height={(paxNights / 3) * 1.7} fill="#7c3aed" rx="2" />
                <rect x={x - 12} y={220 - avail * 1.7} width="24" height={avail * 1.7} fill="#bbf7d0" rx="2" />
              </g>
            );
          })}
        </svg>
      </section>

      {/* Aylık takvim — oda + kişi aynı hücrede */}
      <section className="roomio-grafik-monthly__calendar-panel">
        <div className="roomio-grafik-mockup__cal-legend">
          <span><i className="dot dot--room" /> Oda doluluğu</span>
          <span><i className="dot dot--pax" /> Kişi doluluğu</span>
          <span className="roomio-grafik-monthly__dim-note">{board !== 'Tümü' ? `Pansiyon: ${board}` : 'Tüm pansiyon tipleri'}</span>
        </div>
        <div className="roomio-grafik-mockup__cal-grid roomio-grafik-monthly__grid">
          {WEEKDAYS.map((d) => <div key={d} className="roomio-grafik-mockup__cal-weekday">{d}</div>)}
          {cells.map((day, i) => {
            if (day == null) return <div key={`e-${i}`} className="roomio-grafik-mockup__cal-cell is-empty" />;
            const room = demoRoomOcc(day);
            const pax = demoPaxOcc(day);
            const heat = room >= 85 ? 'is-hot' : room >= 70 ? 'is-mid' : 'is-low';
            return (
              <button key={day} type="button" className={`roomio-grafik-mockup__cal-cell roomio-grafik-elektra__day ${heat}`}>
                <span className="roomio-grafik-mockup__cal-day">{day}</span>
                <span className="roomio-grafik-elektra__occ roomio-grafik-elektra__occ--room">Oda %{room.toFixed(0)}</span>
                <span className="roomio-grafik-elektra__occ roomio-grafik-elektra__occ--pax">Kişi %{pax.toFixed(0)}</span>
                <span className="roomio-grafik-monthly__sub">{Math.round(room * 2.1)} kişi gece</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="roomio-grafik-mockup__info">
        Elektra v5 uyumlu mockup — seçilen dönemde oda ve kişi doluluğu birlikte gösterilir.
        Geniş filtre sihirbazı ile OB/BB/HB/FB, acenta, ülke, EGM, TIS, TGA ve özel alan filtreleri eklenebilir.
      </div>

      <GraphicFilterWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onApply={(f) => setFilters((p) => [...p, f])} />
    </div>
  );
}
