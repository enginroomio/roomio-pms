'use client';

import { useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  Globe,
  Layers,
  Plus,
  Shield,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  FILTER_CATEGORIES,
  type WizardFilter,
} from './GraphicFilterWizard';

type QueueItem = WizardFilter & { logic: 'VE' | 'VEYA' };

type WizardStep = 1 | 2 | 3;

const CATEGORY_GROUPS = [
  {
    title: 'Pansiyon & Gelir',
    icon: Layers,
    ids: ['board', 'revenue'],
  },
  {
    title: 'Konaklama & Doluluk',
    icon: Calendar,
    ids: ['room', 'status', 'occupancy', 'date'],
  },
  {
    title: 'Misafir & Coğrafya',
    icon: Globe,
    ids: ['guest', 'country', 'egm'],
  },
  {
    title: 'Kanal & Pazar',
    icon: Users,
    ids: ['agency', 'channel', 'tga', 'tis'],
  },
  {
    title: 'Sistem',
    icon: Shield,
    ids: ['property', 'user', 'custom'],
  },
];

const VALUE_PRESETS: Record<string, string[]> = {
  board: ['OB (Oda Only)', 'BB (Bed & Breakfast)', 'HB (Half Board)', 'FB (Full Board)', 'AI (All Inclusive)', 'UAI (Ultra AI)'],
  country: ['Türkiye', 'Almanya', 'Rusya', 'İngiltere', 'Hollanda', 'Ukrayna', 'ABD', 'Suudi Arabistan'],
  agency: ['Direct', 'Booking.com', 'Expedia', 'TUI', 'Corporate', 'Sejour', 'Otelz'],
  channel: ['OTA', 'GDS', 'Walk-in', 'Telefon', 'Web', 'E-mail'],
  occupancy: ['Oda doluluğu % ≥', 'Kişi doluluğu % ≥', 'Yatak doluluğu % ≥', 'RevPAR ≥'],
  egm: ['Bildirildi', 'Bekliyor', 'Hatalı', 'Muaf', 'Yabancı uyruk'],
  tis: ['Yerli geceleme', 'Yabancı geceleme', 'Transit', 'Günübirlik'],
  tga: ['Leisure', 'MICE', 'Grup', 'Kurumsal', 'Transit'],
  revenue: ['ADR ≥', 'RevPAR ≥', 'Oda geliri ≥', 'Net gelir ≥'],
  status: ['Kesin', 'Opsiyon', 'Konaklayan', 'Ayrıldı', 'İptal', 'No-show'],
  room: ['SGL', 'DBL', 'TWN', 'TRP', 'SUI', 'Kat 1-3', 'Deniz manzaralı'],
  guest: ['VIP', 'Çocuklu', 'Tek kişi', 'Kalış ≥ 3 gece'],
  date: ['Bu ay', 'Geçen ay', 'Sezon', 'Özel aralık'],
};

const OPERATORS = ['Eşittir', 'İçinde', 'Arasında', '≥', '≤', 'Boş değil', 'Hariç tut'];

const SAVED_PRESETS = [
  { id: 'p1', name: 'HB + Almanya — oda/kişi', filters: 4, user: 'Arda Yılmaz' },
  { id: 'p2', name: 'EGM bekleyen — haftalık', filters: 2, user: 'Resepsiyon' },
  { id: 'p3', name: 'Direct + FB — gelir odak', filters: 3, user: 'Paylaşımlı' },
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: 'q1', category: 'Pansiyon Tipi', label: 'Eşittir: HB (Half Board)', tone: 'amber', logic: 'VE' },
  { id: 'q2', category: 'Ülke / Uyruk', label: 'İçinde: Almanya, Hollanda', tone: 'blue', logic: 'VE' },
];

/** Mockup #3 — Elektra v5 Pro Geniş Filtre Sihirbazı (detaylı) */
export function FilterWizardProMockup() {
  const [step, setStep] = useState<WizardStep>(1);
  const [categoryId, setCategoryId] = useState('board');
  const [operator, setOperator] = useState('Eşittir');
  const [value, setValue] = useState('HB (Half Board)');
  const [logic, setLogic] = useState<'VE' | 'VEYA'>('VE');
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [search, setSearch] = useState('');
  const [presetName, setPresetName] = useState('HB + DACH — aylık oda+kişi grafik');
  const [shareScope, setShareScope] = useState<'me' | 'team' | 'all'>('team');
  const [applyTargets, setApplyTargets] = useState({ grafik: true, kpi: true, takvim: true, export: false });

  const category = FILTER_CATEGORIES.find((c) => c.id === categoryId);
  const valueOptions = VALUE_PRESETS[categoryId] ?? [];

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return CATEGORY_GROUPS;
    const q = search.toLowerCase();
    return CATEGORY_GROUPS.map((g) => ({
      ...g,
      ids: g.ids.filter((id) => {
        const c = FILTER_CATEGORIES.find((x) => x.id === id);
        return c && (c.label.toLowerCase().includes(q) || c.examples.toLowerCase().includes(q));
      }),
    })).filter((g) => g.ids.length > 0);
  }, [search]);

  const previewExpr = useMemo(() => {
    if (queue.length === 0) return 'Filtre yok — tüm veri gösterilir';
    return queue.map((f, i) => `${i > 0 ? ` ${f.logic} ` : ''}[${f.category}] ${f.label}`).join('');
  }, [queue]);

  const addToQueue = () => {
    if (!category) return;
    setQueue((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        category: category.label,
        label: `${operator}: ${value}`,
        tone: category.tone,
        logic,
      },
    ]);
    setStep(1);
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="roomio-grafik-mockup roomio-grafik-mockup--wizard-pro">
      <div className="roomio-grafik-mockup__badge">Mockup #3 · Elektra v5 Pro — Geniş Filtre Sihirbazı (Detaylı)</div>

      <header className="roomio-wizard-pro__intro">
        <div>
          <h2>Geniş Filtre Sihirbazı</h2>
          <p>
            16 kategori · OB/BB/HB/FB/AI/UAI · ülke · acenta · EGM · TIS · TGA · oda/kişi doluluğu.
            Filtre kuyruğu, VE/VEYA mantığı, kayıtlı görünümler ve grafik/KPI/takvim hedefleri.
          </p>
        </div>
        <div className="roomio-wizard-pro__intro-actions">
          <span className="roomio-wizard-pro__pill"><SlidersHorizontal size={14} /> 16 kategori</span>
          <span className="roomio-wizard-pro__pill"><Bookmark size={14} /> 3 kayıtlı set</span>
        </div>
      </header>

      <div className="roomio-wizard-pro__layout">
        {/* Sol: arka plan grafik ekranı (context) */}
        <div className="roomio-wizard-pro__backdrop" aria-hidden>
          <div className="roomio-wizard-pro__backdrop-bar" />
          <div className="roomio-wizard-pro__backdrop-kpis" />
          <div className="roomio-wizard-pro__backdrop-chart" />
          <p>Grafikler F1 — Haziran 2026 · Oda + Kişi doluluğu</p>
        </div>

        {/* Orta: sihirbaz */}
        <div className="roomio-grafik-wizard roomio-grafik-wizard--pro" role="dialog" aria-label="Geniş filtre sihirbazı">
          <header className="roomio-grafik-wizard__head">
            <div>
              <p className="roomio-grafik-wizard__eyebrow">Elektra v5 Pro · Adım {step}/3</p>
              <h3>Grafik verisi filtrele</h3>
              <p className="roomio-grafik-wizard__sub">Kategori seç → koşul tanımla → kuyruğa ekle → kaydet & uygula</p>
            </div>
          </header>

          <div className="roomio-grafik-wizard__steps roomio-grafik-wizard__steps--clickable">
            {(['Kategori seç', 'Koşul tanımla', 'Kaydet & uygula'] as const).map((label, i) => {
              const n = (i + 1) as WizardStep;
              return (
                <button
                  key={label}
                  type="button"
                  className={`roomio-grafik-wizard__step${step >= n ? ' is-done' : ''}${step === n ? ' is-active' : ''}`}
                  onClick={() => setStep(n)}
                >
                  {n}. {label}
                </button>
              );
            })}
          </div>

          {step === 1 ? (
            <div className="roomio-wizard-pro__step1">
              <input
                className="roomio-grafik-wizard__search"
                placeholder="Ara: pansiyon, HB, ülke, acenta, EGM, doluluk…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="roomio-wizard-pro__groups">
                {filteredGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <section key={group.title} className="roomio-wizard-pro__group">
                      <h4><Icon size={14} /> {group.title}</h4>
                      <div className="roomio-grafik-wizard__grid roomio-grafik-wizard__grid--3">
                        {group.ids.map((id) => {
                          const c = FILTER_CATEGORIES.find((x) => x.id === id)!;
                          return (
                            <button
                              key={id}
                              type="button"
                              className={`roomio-grafik-wizard__cat roomio-grafik-wizard__cat--${c.tone}${categoryId === id ? ' is-active' : ''}`}
                              onClick={() => {
                                setCategoryId(id);
                                setValue(VALUE_PRESETS[id]?.[0] ?? '');
                              }}
                            >
                              <strong>{c.label}</strong>
                              <span>{c.examples}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="roomio-grafik-wizard__form roomio-wizard-pro__step2">
              <p className="roomio-grafik-wizard__selected">
                Seçili: <strong>{category?.label}</strong>
                <span className="roomio-wizard-pro__cat-hint">{category?.examples}</span>
              </p>

              <div className="roomio-wizard-pro__logic">
                <span>Birleştirme:</span>
                <button type="button" className={logic === 'VE' ? 'is-active' : ''} onClick={() => setLogic('VE')}>VE (AND)</button>
                <button type="button" className={logic === 'VEYA' ? 'is-active' : ''} onClick={() => setLogic('VEYA')}>VEYA (OR)</button>
              </div>

              <div className="roomio-grafik-wizard__form-row">
                <label>
                  <span>Operatör</span>
                  <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                    {OPERATORS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  <span>Değer</span>
                  {valueOptions.length > 0 ? (
                    <select value={value} onChange={(e) => setValue(e.target.value)}>
                      {valueOptions.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  ) : (
                    <input value={value} onChange={(e) => setValue(e.target.value)} />
                  )}
                </label>
              </div>

              {categoryId === 'board' ? (
                <div className="roomio-grafik-wizard__quick-picks roomio-wizard-pro__board-grid">
                  {['OB', 'BB', 'HB', 'FB', 'AI', 'UAI'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={value.startsWith(b) ? 'is-active' : ''}
                      onClick={() => setValue(VALUE_PRESETS.board.find((v) => v.startsWith(b)) ?? b)}
                    >
                      <strong>{b}</strong>
                      <small>{b === 'OB' ? 'Oda' : b === 'BB' ? 'Kahvaltı' : b === 'HB' ? 'Yarım pans.' : b === 'FB' ? 'Tam pans.' : b === 'AI' ? 'Her şey dahil' : 'Ultra AI'}</small>
                    </button>
                  ))}
                </div>
              ) : null}

              {categoryId === 'country' ? (
                <div className="roomio-wizard-pro__multiselect">
                  {['Türkiye', 'Almanya', 'Rusya', 'Hollanda'].map((c) => (
                    <label key={c}><input type="checkbox" defaultChecked={c === 'Almanya' || c === 'Hollanda'} /> {c}</label>
                  ))}
                </div>
              ) : null}

              <div className="roomio-grafik-wizard__preview">
                <span>Canlı önizleme</span>
                <code>{logic} [{category?.label}] {operator} &quot;{value}&quot;</code>
              </div>

              <button type="button" className="roomio-wizard-pro__add-btn" onClick={addToQueue}>
                <Plus size={16} /> Kuyruğa ekle
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="roomio-grafik-wizard__form roomio-wizard-pro__step3">
              <label>
                <span>Görünüm / filtre seti adı</span>
                <input value={presetName} onChange={(e) => setPresetName(e.target.value)} />
              </label>

              <fieldset className="roomio-grafik-wizard__share">
                <legend>Paylaşım</legend>
                <label><input type="radio" name="share" checked={shareScope === 'me'} onChange={() => setShareScope('me')} /> Sadece ben</label>
                <label><input type="radio" name="share" checked={shareScope === 'team'} onChange={() => setShareScope('team')} /> Ön büro ekibi</label>
                <label><input type="radio" name="share" checked={shareScope === 'all'} onChange={() => setShareScope('all')} /> Tüm kullanıcılar</label>
              </fieldset>

              <fieldset className="roomio-wizard-pro__targets">
                <legend>Uygula hedefleri</legend>
                {(['grafik', 'kpi', 'takvim', 'export'] as const).map((t) => (
                  <label key={t}>
                    <input
                      type="checkbox"
                      checked={applyTargets[t]}
                      onChange={(e) => setApplyTargets((p) => ({ ...p, [t]: e.target.checked }))}
                    />
                    {t === 'grafik' ? 'Çizgi & sütun grafikleri' : t === 'kpi' ? 'KPI kartları' : t === 'takvim' ? 'Aylık takvim' : 'Dışa aktar şablonu'}
                  </label>
                ))}
              </fieldset>

              <label className="roomio-wizard-pro__default">
                <input type="checkbox" defaultChecked />
                Bu otel için varsayılan açılış görünümü yap
              </label>
            </div>
          ) : null}

          <footer className="roomio-grafik-wizard__foot">
            <button type="button" className="roomio-grafik-wizard__ghost" onClick={() => setStep((s) => (s > 1 ? (s - 1) as WizardStep : 1))}>
              Geri
            </button>
            {step < 3 ? (
              <button type="button" className="roomio-grafik-wizard__primary" onClick={() => setStep((s) => (s + 1) as WizardStep)}>
                İleri
              </button>
            ) : (
              <button type="button" className="roomio-grafik-wizard__primary">Uygula & Kaydet ({queue.length} filtre)</button>
            )}
          </footer>
        </div>

        {/* Sağ: kuyruk + önizleme paneli */}
        <aside className="roomio-wizard-pro__panel">
          <section className="roomio-wizard-pro__panel-block">
            <h4>Filtre kuyruğu ({queue.length})</h4>
            <ul className="roomio-wizard-pro__queue">
              {queue.map((f, i) => (
                <li key={f.id} className={`tone-${f.tone}`}>
                  {i > 0 ? <em className="roomio-wizard-pro__logic-tag">{f.logic}</em> : null}
                  <div>
                    <strong>{f.category}</strong>
                    <span>{f.label}</span>
                  </div>
                  <button type="button" aria-label="Kaldır" onClick={() => removeFromQueue(f.id)}><X size={14} /></button>
                </li>
              ))}
            </ul>
            <button type="button" className="roomio-wizard-pro__clear" onClick={() => setQueue([])}>
              <Trash2 size={14} /> Tümünü temizle
            </button>
          </section>

          <section className="roomio-wizard-pro__panel-block">
            <h4>Sorgu önizleme</h4>
            <pre className="roomio-wizard-pro__expr">{previewExpr}</pre>
            <dl className="roomio-wizard-pro__impact">
              <div><dt>Tahmini gün</dt><dd>24 / 30</dd></div>
              <div><dt>Ort. oda dol.</dt><dd>%71,2</dd></div>
              <div><dt>Ort. kişi dol.</dt><dd>%78,8</dd></div>
            </dl>
          </section>

          <section className="roomio-wizard-pro__panel-block">
            <h4>Kayıtlı setler</h4>
            {SAVED_PRESETS.map((p) => (
              <button key={p.id} type="button" className="roomio-wizard-pro__preset">
                <strong>{p.name}</strong>
                <span>{p.filters} filtre · {p.user}</span>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
