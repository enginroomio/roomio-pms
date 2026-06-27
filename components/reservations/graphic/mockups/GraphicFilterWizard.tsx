'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export type WizardFilter = {
  id: string;
  category: string;
  label: string;
  tone: 'blue' | 'teal' | 'slate' | 'amber' | 'violet' | 'rose' | 'indigo';
};

export const FILTER_CATEGORIES = [
  { id: 'date', label: 'Tarih / Dönem', examples: 'Ay, hafta, sezon, iş günü', tone: 'slate' as const },
  { id: 'board', label: 'Pansiyon Tipi', examples: 'OB · BB · HB · FB · AI · UAI', tone: 'amber' as const },
  { id: 'room', label: 'Oda & Tip', examples: 'SGL, DBL, kat, manzara', tone: 'slate' as const },
  { id: 'country', label: 'Ülke / Uyruk', examples: 'TR, DE, RU, UK…', tone: 'blue' as const },
  { id: 'agency', label: 'Acenta', examples: 'Booking, TUI, Direct…', tone: 'indigo' as const },
  { id: 'channel', label: 'Kanal / Kaynak', examples: 'OTA, GDS, Walk-in', tone: 'violet' as const },
  { id: 'guest', label: 'Misafir', examples: 'VIP, çocuk, kalış süresi', tone: 'rose' as const },
  { id: 'egm', label: 'EGM / Kimlik', examples: 'Bildirim, uyruk, pasaport', tone: 'blue' as const },
  { id: 'tis', label: 'TIS İstatistik', examples: 'Geceleme, geliş tipi', tone: 'teal' as const },
  { id: 'tga', label: 'TGA Segment', examples: 'Leisure, MICE, Grup', tone: 'violet' as const },
  { id: 'occupancy', label: 'Doluluk Metriği', examples: 'Oda %, kişi %, yatak', tone: 'teal' as const },
  { id: 'revenue', label: 'Gelir / Fiyat', examples: 'RevPAR, ADR, gelir', tone: 'amber' as const },
  { id: 'status', label: 'Rez. Durumu', examples: 'Kesin, opsiyon, konaklayan', tone: 'slate' as const },
  { id: 'user', label: 'Kullanıcı / Rol', examples: 'Ön büro, muhasebe', tone: 'indigo' as const },
  { id: 'property', label: 'Tesis / Otel', examples: 'Çoklu otel seçimi', tone: 'blue' as const },
  { id: 'custom', label: 'Özel Alan / SQL', examples: 'Gelişmiş sorgu', tone: 'rose' as const },
];

const OPERATORS = ['Eşittir', 'İçinde', 'Arasında', 'Büyük', 'Küçük', 'Boş değil', 'Hariç'];

const VALUE_PRESETS: Record<string, string[]> = {
  board: ['OB (Oda)', 'BB (Bed & Breakfast)', 'HB (Half Board)', 'FB (Full Board)', 'AI (All Inclusive)', 'UAI (Ultra AI)'],
  country: ['Türkiye', 'Almanya', 'Rusya', 'İngiltere', 'Hollanda', 'ABD'],
  agency: ['Direct', 'Booking.com', 'Expedia', 'TUI', 'Corporate', 'Sejours'],
  channel: ['OTA', 'GDS', 'Walk-in', 'Telefon', 'Web'],
  occupancy: ['Oda doluluğu %', 'Kişi doluluğu %', 'Yatak doluluğu %'],
  egm: ['Bildirildi', 'Bekliyor', 'Hatalı', 'Muaf'],
};

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (filter: WizardFilter) => void;
};

export function GraphicFilterWizard({ open, onClose, onApply }: Props) {
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('board');
  const [operator, setOperator] = useState('Eşittir');
  const [value, setValue] = useState('HB (Half Board)');
  const [presetName, setPresetName] = useState('');
  const [shareScope, setShareScope] = useState<'me' | 'team' | 'all'>('me');
  const [search, setSearch] = useState('');

  if (!open) return null;

  const category = FILTER_CATEGORIES.find((c) => c.id === categoryId);
  const valueOptions = VALUE_PRESETS[categoryId] ?? [];
  const filteredCats = FILTER_CATEGORIES.filter(
    (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.examples.toLowerCase().includes(search.toLowerCase()),
  );

  const reset = () => {
    setStep(1);
    setCategoryId('board');
    setOperator('Eşittir');
    setValue('HB (Half Board)');
    setPresetName('');
    setShareScope('me');
    setSearch('');
  };

  const pickCategory = (id: string) => {
    setCategoryId(id);
    const presets = VALUE_PRESETS[id];
    setValue(presets?.[0] ?? '');
  };

  const handleApply = () => {
    onApply({
      id: `w-${Date.now()}`,
      category: category?.label ?? 'Filtre',
      label: `${operator}: ${value}`,
      tone: category?.tone ?? 'slate',
    });
    reset();
  };

  return (
    <div className="roomio-grafik-wizard-backdrop" onClick={onClose} role="presentation">
      <div className="roomio-grafik-wizard roomio-grafik-wizard--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="roomio-grafik-wizard__head">
          <div>
            <p className="roomio-grafik-wizard__eyebrow">Geniş Filtre Sihirbazı · Adım {step}/3</p>
            <h3>Grafik verisi filtrele</h3>
            <p className="roomio-grafik-wizard__sub">OB/BB/HB/FB · acenta · ülke · EGM · TIS · TGA ve 16 kategori</p>
          </div>
          <button type="button" className="roomio-grafik-wizard__close" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        </header>

        <div className="roomio-grafik-wizard__steps">
          {['Kategori seç', 'Koşul tanımla', 'Kaydet & uygula'].map((label, i) => (
            <span key={label} className={`roomio-grafik-wizard__step${step >= i + 1 ? ' is-done' : ''}${step === i + 1 ? ' is-active' : ''}`}>{label}</span>
          ))}
        </div>

        {step === 1 ? (
          <>
            <input
              className="roomio-grafik-wizard__search"
              placeholder="Kategori ara… (pansiyon, ülke, acenta, EGM…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="roomio-grafik-wizard__grid roomio-grafik-wizard__grid--4">
              {filteredCats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`roomio-grafik-wizard__cat${categoryId === c.id ? ' is-active' : ''}`}
                  onClick={() => pickCategory(c.id)}
                >
                  <strong>{c.label}</strong>
                  <span>{c.examples}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="roomio-grafik-wizard__form">
            <p className="roomio-grafik-wizard__selected">Seçili kategori: <strong>{category?.label}</strong></p>
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
                  <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Değer girin…" />
                )}
              </label>
            </div>
            {categoryId === 'board' ? (
              <div className="roomio-grafik-wizard__quick-picks">
                {['OB', 'BB', 'HB', 'FB', 'AI', 'UAI'].map((b) => (
                  <button key={b} type="button" className={value.startsWith(b) ? 'is-active' : ''} onClick={() => setValue(VALUE_PRESETS.board?.find((v) => v.startsWith(b)) ?? b)}>
                    {b}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="roomio-grafik-wizard__preview">
              <span>Önizleme</span>
              <code>{category?.label} · {operator} · {value}</code>
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="roomio-grafik-wizard__form">
            <label>
              <span>Görünüm / filtre seti adı</span>
              <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Örn: HB + DE acenta — aylık oda+kişi" />
            </label>
            <fieldset className="roomio-grafik-wizard__share">
              <legend>Paylaşım kapsamı</legend>
              <label><input type="radio" name="share" checked={shareScope === 'me'} onChange={() => setShareScope('me')} /> Sadece ben</label>
              <label><input type="radio" name="share" checked={shareScope === 'team'} onChange={() => setShareScope('team')} /> Ön büro ekibi</label>
              <label><input type="radio" name="share" checked={shareScope === 'all'} onChange={() => setShareScope('all')} /> Tüm kullanıcılar</label>
            </fieldset>
            <p className="roomio-grafik-wizard__hint">Filtre grafik, takvim ve KPI&apos;lara anında uygulanır.</p>
          </div>
        ) : null}

        <footer className="roomio-grafik-wizard__foot">
          <button type="button" className="roomio-grafik-wizard__ghost" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}>
            {step === 1 ? 'İptal' : 'Geri'}
          </button>
          {step < 3 ? (
            <button type="button" className="roomio-grafik-wizard__primary" onClick={() => setStep((s) => s + 1)}>İleri</button>
          ) : (
            <button type="button" className="roomio-grafik-wizard__primary" onClick={handleApply}>Uygula & Kaydet</button>
          )}
        </footer>
      </div>
    </div>
  );
}
