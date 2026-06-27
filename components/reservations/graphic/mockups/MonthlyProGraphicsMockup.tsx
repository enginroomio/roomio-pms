'use client';

import { useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { GraphicFilterWizard, type WizardFilter } from './GraphicFilterWizard';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

type Dimension = 'genel' | 'egm' | 'tis' | 'tga' | 'kullanici';

const DIMENSIONS: { id: Dimension; label: string; hint: string }[] = [
  { id: 'genel', label: 'Genel', hint: 'Doluluk & gelir' },
  { id: 'egm', label: 'EGM', hint: 'Kimlik / uyruk' },
  { id: 'tis', label: 'TIS', hint: 'Turizm istatistik' },
  { id: 'tga', label: 'TGA', hint: 'Pazar & kanal' },
  { id: 'kullanici', label: 'Kullanıcı', hint: 'Kayıtlı görünümler' },
];

const PRESET_VIEWS = [
  { id: 'fo-daily', label: 'Ön büro — günlük', user: 'Arda Yılmaz', shared: false },
  { id: 'egm-weekly', label: 'EGM haftalık kontrol', user: 'Sistem', shared: true },
  { id: 'rev-month', label: 'Gelir odaklı ay', user: 'Muhasebe', shared: true },
];

const BASE_FILTERS: WizardFilter[] = [
  { id: 'f1', category: 'Otel', label: 'Hotel Sapphire İstanbul', tone: 'blue' },
  { id: 'f2', category: 'Oda tipi', label: 'Tümü', tone: 'slate' },
  { id: 'f3', category: 'Görünüm', label: 'Ay', tone: 'teal' },
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

function demoOcc(day: number, dim: Dimension) {
  const base = 52 + ((day * 11 + dim.length * 5) % 38);
  if (dim === 'egm') return base - 4;
  if (dim === 'tis') return base + 2;
  if (dim === 'tga') return base - 1;
  return base;
}

function demoRev(occ: number) {
  return Math.round(78000 + occ * 520);
}

export function MonthlyProGraphicsMockup() {
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(2026);
  const [dimension, setDimension] = useState<Dimension>('genel');
  const [filters, setFilters] = useState<WizardFilter[]>(BASE_FILTERS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('fo-daily');
  const [displayMode, setDisplayMode] = useState<'pct' | 'value'>('pct');

  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const monthLabel = `${MONTHS_TR[month]} ${year}`;

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const kpis = useMemo(() => {
    const avg = dimension === 'egm' ? 71.2 : dimension === 'tis' ? 74.8 : dimension === 'tga' ? 69.5 : 72.4;
    return [
      { label: 'Ortalama Doluluk', value: `%${avg.toFixed(1).replace('.', ',')}`, delta: '+5,7%', up: true },
      { label: 'Oda Geliri', value: '₺2.845.600', delta: '+18,0%', up: true },
      { label: 'RevPAR', value: '₺1.023', delta: '+15,5%', up: true },
      { label: 'Geceleme', value: '1.248', delta: '+12,4%', up: true },
      { label: 'EGM Uyum', value: '%98,2', delta: '+0,8%', up: true },
    ];
  }, [dimension]);

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--monthly-pro">
      <div className="roomio-grafik-mockup__badge">Mockup Pro · Aylık Grafikler F1 — EGM · TIS · TGA · Kullanıcı</div>

      <header className="roomio-grafik-monthly__head">
        <div>
          <h2>Grafikler — Aylık Görünüm</h2>
          <p>Önceki / sonraki ay · boyut seçimi · sihirbaz ile genişletilebilir filtreler</p>
        </div>
        <div className="roomio-grafik-monthly__month-nav">
          <button type="button" aria-label="Önceki ay" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={18} />
          </button>
          <strong>{monthLabel}</strong>
          <button type="button" aria-label="Sonraki ay" onClick={() => shiftMonth(1)}>
            <ChevronRight size={18} />
          </button>
          <button type="button" className="roomio-grafik-monthly__today">Bugün</button>
        </div>
      </header>

      <div className="roomio-grafik-monthly__dimensions" role="tablist" aria-label="Rapor boyutu">
        {DIMENSIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={dimension === d.id}
            className={`roomio-grafik-monthly__dim${dimension === d.id ? ' is-active' : ''}`}
            onClick={() => setDimension(d.id)}
          >
            <strong>{d.label}</strong>
            <span>{d.hint}</span>
          </button>
        ))}
      </div>

      <div className="roomio-grafik-monthly__toolbar">
        <div className="roomio-grafik-monthly__toolbar-row">
          <label>
            <span>Kayıtlı görünüm</span>
            <select value={activePreset} onChange={(e) => setActivePreset(e.target.value)}>
              {PRESET_VIEWS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}{p.shared ? ' (paylaşımlı)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Kullanıcı</span>
            <select defaultValue="arda">
              <option value="arda">Arda Yılmaz — Ön büro</option>
              <option value="sys">Sistem Yöneticisi</option>
              <option value="muh">Muhasebe</option>
            </select>
          </label>
          <label>
            <span>Oda tipi</span>
            <select defaultValue="all"><option value="all">Tümü</option><option>DBL</option><option>SUI</option></select>
          </label>
          <label>
            <span>Acenta / Kanal</span>
            <select defaultValue="all"><option value="all">Tümü</option><option>Booking</option><option>Direct</option></select>
          </label>
          <label>
            <span>Durum</span>
            <select defaultValue="all"><option value="all">Tümü</option><option>Kesin</option><option>Konaklayan</option></select>
          </label>
          <div className="roomio-grafik-mockup__seg">
            <button type="button">Gün</button>
            <button type="button">Hafta</button>
            <button type="button" className="is-active">Ay</button>
          </div>
        </div>

        <div className="roomio-grafik-monthly__toolbar-actions">
          <button type="button" className="roomio-grafik-monthly__wizard-btn" onClick={() => setWizardOpen(true)}>
            <SlidersHorizontal size={16} /> Filtre Sihirbazı
          </button>
          <button type="button" className="roomio-grafik-monthly__ghost-btn">
            <Plus size={15} /> Yeni görünüm
          </button>
          <button type="button" className="roomio-grafik-monthly__ghost-btn">
            <Bookmark size={15} /> Kaydet
          </button>
          <button type="button" className="roomio-grafik-mockup__report">Raporla</button>
          <button type="button" className="roomio-grafik-mockup__export">Dışa Aktar</button>
        </div>
      </div>

      <div className="roomio-grafik-monthly__chips" aria-label="Aktif filtreler">
        {filters.map((f) => (
          <span key={f.id} className={`roomio-grafik-monthly__chip tone-${f.tone}`}>
            <em>{f.category}</em> {f.label}
            <button type="button" aria-label={`${f.label} filtresini kaldir`} onClick={() => removeFilter(f.id)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <button type="button" className="roomio-grafik-monthly__chip-add" onClick={() => setWizardOpen(true)}>
          <Plus size={12} /> Filtre ekle
        </button>
      </div>

      <div className="roomio-grafik-mockup__kpis">
        {kpis.map((k) => (
          <article key={k.label} className="roomio-grafik-mockup__kpi">
            <span className="roomio-grafik-mockup__kpi-label">{k.label}</span>
            <strong className="roomio-grafik-mockup__kpi-value">{k.value}</strong>
            <span className={`roomio-grafik-mockup__kpi-delta${k.up ? ' is-up' : ' is-down'}`}>{k.delta}</span>
          </article>
        ))}
      </div>

      <div className="roomio-grafik-monthly__body">
        <section className="roomio-grafik-monthly__calendar-panel">
          <div className="roomio-grafik-mockup__cal-legend">
            <span><i className="dot dot--occ" /> Doluluk %</span>
            <span><i className="dot dot--rev" /> Oda geliri</span>
            {dimension === 'egm' ? <span className="roomio-grafik-monthly__dim-note">EGM: uyruk bildirim orani</span> : null}
            {dimension === 'tis' ? <span className="roomio-grafik-monthly__dim-note">TIS: geceleme istatistigi</span> : null}
            {dimension === 'tga' ? <span className="roomio-grafik-monthly__dim-note">TGA: kanal / segment</span> : null}
            <div className="roomio-grafik-mockup__toggle">
              <button type="button" className={displayMode === 'pct' ? 'is-active' : ''} onClick={() => setDisplayMode('pct')}>Yüzde</button>
              <button type="button" className={displayMode === 'value' ? 'is-active' : ''} onClick={() => setDisplayMode('value')}>Değer</button>
            </div>
          </div>

          <div className="roomio-grafik-mockup__cal-grid roomio-grafik-monthly__grid">
            {WEEKDAYS.map((d) => (
              <div key={d} className="roomio-grafik-mockup__cal-weekday">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (day == null) return <div key={`e-${i}`} className="roomio-grafik-mockup__cal-cell is-empty" />;
              const occ = demoOcc(day, dimension);
              const heat = occ >= 85 ? 'is-hot' : occ >= 70 ? 'is-mid' : 'is-low';
              const rev = demoRev(occ);
              return (
                <button key={`d-${day}`} type="button" className={`roomio-grafik-mockup__cal-cell roomio-grafik-monthly__day ${heat}`}>
                  <span className="roomio-grafik-mockup__cal-day">{day}</span>
                  {displayMode === 'pct' ? (
                    <span className="roomio-grafik-mockup__cal-occ">%{occ.toFixed(1).replace('.', ',')}</span>
                  ) : (
                    <span className="roomio-grafik-mockup__cal-rev">₺{rev.toLocaleString('tr-TR')}</span>
                  )}
                  <span className="roomio-grafik-monthly__sub">
                    {dimension === 'egm' ? `Bildirim ${Math.min(99, occ + 8)}%` : dimension === 'tis' ? `${Math.round(occ * 0.9)} gece` : dimension === 'tga' ? 'Direct %42' : `₺${Math.round(rev / 1000)}k`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="roomio-grafik-monthly__side">
          <h4>Boyut özeti — {DIMENSIONS.find((d) => d.id === dimension)?.label}</h4>
          <ul className="roomio-grafik-monthly__side-list">
            {dimension === 'egm' && (
              <>
                <li><span>Türk vatandaş</span><strong>%62</strong></li>
                <li><span>Yabancı</span><strong>%38</strong></li>
                <li><span>Bekleyen bildirim</span><strong className="is-warn">3</strong></li>
              </>
            )}
            {dimension === 'tis' && (
              <>
                <li><span>Yerli geceleme</span><strong>412</strong></li>
                <li><span>Yabancı geceleme</span><strong>836</strong></li>
                <li><span>Ort. kalış</span><strong>2,4 gece</strong></li>
              </>
            )}
            {dimension === 'tga' && (
              <>
                <li><span>Direct</span><strong>%42</strong></li>
                <li><span>OTA</span><strong>%35</strong></li>
                <li><span>Kurumsal</span><strong>%23</strong></li>
              </>
            )}
            {(dimension === 'genel' || dimension === 'kullanici') && (
              <>
                <li><span>Dolu oda</span><strong>521</strong></li>
                <li><span>Müsait oda</span><strong>1.959</strong></li>
                <li><span>Pick-up (7g)</span><strong className="is-up">+84</strong></li>
              </>
            )}
          </ul>

          <h4>Kullanıcı görünümleri</h4>
          <div className="roomio-grafik-monthly__presets">
            {PRESET_VIEWS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`roomio-grafik-monthly__preset${activePreset === p.id ? ' is-active' : ''}`}
                onClick={() => setActivePreset(p.id)}
              >
                <strong>{p.label}</strong>
                <span>{p.user}{p.shared ? ' · paylaşımlı' : ''}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="roomio-grafik-mockup__info">
        Aylık grafik mockup — EGM / TIS / TGA boyutları ve kullanıcı bazlı kayıtlı filtre setleri.
        Filtre Sihirbazı ile yeni koşul ekleyin; görünümü kaydedin veya paylaşın.
      </div>

      <GraphicFilterWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onApply={(filter) => {
          setFilters((prev) => [...prev, filter]);
          setWizardOpen(false);
        }}
      />
    </div>
  );
}
