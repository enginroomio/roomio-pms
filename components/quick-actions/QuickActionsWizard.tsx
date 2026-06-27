'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Search,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  catalogItemById,
  DEFAULT_QUICK_ACTIONS,
  QUICK_ACTION_MAX_ITEMS,
  QUICK_ACTION_CATALOG,
  QUICK_ACTION_CATEGORIES,
  readQuickActions,
  saveQuickActions,
  type QuickActionCatalogItem,
  type UserQuickAction,
} from '@/lib/shortcuts/quick-actions';

type Props = {
  open: boolean;
  onClose: () => void;
};

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Kısayollarınız',
  2: 'Menüden ekle',
  3: 'Özel bağlantı',
};

const SHORTCUT_HINTS: Record<string, string> = {
  '/reservations/calendar': 'F1',
  '/reservations/new': 'F2',
  '/reception/inhouse': 'F3',
  '/rooms': 'F12',
  '/reception': 'F6',
};

function resolveItemLabel(item: UserQuickAction) {
  if (item.customLabel && item.customHref) {
    return {
      label: item.customLabel,
      href: item.customHref,
      category: 'Özel',
      custom: true,
    };
  }
  const cat = item.catalogId ? catalogItemById(item.catalogId) : undefined;
  if (!cat) return null;
  return {
    label: cat.label,
    href: cat.href,
    category: cat.category,
    custom: false,
  };
}

export function QuickActionsWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [items, setItems] = useState<UserQuickAction[]>(DEFAULT_QUICK_ACTIONS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [customLabel, setCustomLabel] = useState('');
  const [customHref, setCustomHref] = useState('');
  const [customKey, setCustomKey] = useState('');

  useEffect(() => {
    if (open) {
      setItems(readQuickActions());
      setStep(1);
      setSearch('');
      setCategory('all');
      setCustomLabel('');
      setCustomHref('');
      setCustomKey('');
    }
  }, [open]);

  const usedCatalogIds = useMemo(() => new Set(items.map((item) => item.catalogId).filter(Boolean)), [items]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return QUICK_ACTION_CATALOG.filter((item) => {
      if (usedCatalogIds.has(item.id)) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.label.toLocaleLowerCase('tr-TR').includes(q)
        || item.href.toLocaleLowerCase('tr-TR').includes(q)
        || item.category.toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [category, search, usedCatalogIds]);

  if (!open) return null;

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addCatalogItem(cat: QuickActionCatalogItem) {
    if (items.length >= QUICK_ACTION_MAX_ITEMS) return;
    if (items.some((item) => item.catalogId === cat.id)) return;
    setItems((prev) => [
      ...prev,
      { id: `qa-${Date.now().toString(36)}`, catalogId: cat.id, key: SHORTCUT_HINTS[cat.href] ?? '' },
    ]);
  }

  function addCustomItem() {
    const label = customLabel.trim();
    const href = customHref.trim();
    if (!label || !href || items.length >= QUICK_ACTION_MAX_ITEMS) return;
    setItems((prev) => [
      ...prev,
      {
        id: `qa-custom-${Date.now().toString(36)}`,
        customLabel: label,
        customHref: href.startsWith('/') ? href : `/${href.replace(/^\/+/, '')}`,
        key: customKey.trim().toUpperCase(),
      },
    ]);
    setCustomLabel('');
    setCustomHref('');
    setCustomKey('');
    setStep(1);
  }

  function save() {
    saveQuickActions(items);
    onClose();
  }

  return (
    <div className="roomio-modal-backdrop" role="dialog" aria-modal="true" aria-label="Hızlı işlemler sihirbazı">
      <div className="roomio-modal roomio-modal--wide roomio-quick-wizard">
        <div className="roomio-modal__head">
          <div className="roomio-quick-wizard__title">
            <Wand2 size={18} aria-hidden />
            <h2>Hızlı İşlemler Sihirbazı</h2>
          </div>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={onClose} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>

        <p className="roomio-page-desc">
          Ana sayfadaki hızlı işlem çubuğunu kişiselleştirin. Tüm menüden seçim yapabilir, sıralayabilir ve özel bağlantı ekleyebilirsiniz.
        </p>

        <div className="roomio-quick-wizard__steps" role="tablist" aria-label="Sihirbaz adımları">
          {([1, 2, 3] as WizardStep[]).map((stepNo) => (
            <button
              key={stepNo}
              type="button"
              role="tab"
              aria-selected={step === stepNo}
              className={`roomio-quick-wizard__step${step === stepNo ? ' is-active' : ''}`}
              onClick={() => setStep(stepNo)}
            >
              <span>{stepNo}</span>
              {STEP_LABELS[stepNo]}
            </button>
          ))}
        </div>

        {step === 1 ? (
          <div className="roomio-quick-wizard__panel">
            <div className="roomio-quick-wizard__panel-head">
              <h3>Aktif kısayollar</h3>
              <span>{items.length}/{QUICK_ACTION_MAX_ITEMS}</span>
            </div>
            {items.length === 0 ? (
              <p className="roomio-page-desc">Henüz kısayol yok. 2. adımdan menüden ekleyin veya özel bağlantı oluşturun.</p>
            ) : null}
            <div className="roomio-quick-wizard__active-list">
              {items.map((item, index) => {
                const resolved = resolveItemLabel(item);
                if (!resolved) return null;
                return (
                  <div key={item.id} className="roomio-shortcut-editor__row">
                    <Sparkles size={14} className="roomio-quick-wizard__spark" aria-hidden />
                    <div className="roomio-quick-wizard__active-copy">
                      <strong>{resolved.label}</strong>
                      <small>{resolved.href}{resolved.custom ? ' · özel' : ` · ${resolved.category}`}</small>
                    </div>
                    <input
                      className="roomio-input roomio-shortcut-editor__key"
                      value={item.key}
                      placeholder="F2"
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, key: e.target.value.toUpperCase() } : entry,
                          ),
                        )
                      }
                    />
                    <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => move(item.id, -1)} disabled={index === 0}>
                      <ChevronUp size={14} />
                    </button>
                    <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => move(item.id, 1)} disabled={index === items.length - 1}>
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => remove(item.id)}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="roomio-quick-wizard__panel">
            <div className="roomio-quick-wizard__toolbar">
              <label className="roomio-quick-wizard__search">
                <Search size={16} aria-hidden />
                <input
                  className="roomio-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ekran, menü veya URL ara…"
                />
              </label>
              <select className="roomio-input roomio-quick-wizard__category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {QUICK_ACTION_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry === 'all' ? 'Tüm modüller' : entry}
                  </option>
                ))}
              </select>
            </div>
            <p className="roomio-page-desc">
              {filteredCatalog.length} ekran bulundu · Katalog sidebar menüsündeki tüm ekranları kapsar.
            </p>
            <div className="roomio-quick-wizard__catalog">
              {filteredCatalog.slice(0, 80).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="roomio-shortcut-editor__add"
                  disabled={items.length >= QUICK_ACTION_MAX_ITEMS}
                  onClick={() => addCatalogItem(cat)}
                >
                  <Plus size={14} />
                  <span className="roomio-quick-wizard__catalog-label">{cat.label}</span>
                  <small>{cat.category}</small>
                </button>
              ))}
              {filteredCatalog.length === 0 ? (
                <p className="roomio-page-desc">Aramanızla eşleşen ekran kalmadı veya zaten eklendi.</p>
              ) : null}
              {filteredCatalog.length > 80 ? (
                <p className="roomio-page-desc">Liste çok uzun — arama veya kategori filtresi kullanın.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="roomio-quick-wizard__panel">
            <h3>Özel kısayol</h3>
            <p className="roomio-page-desc">Menüde olmayan bir sayfa veya bağlantı ekleyin.</p>
            <div className="roomio-quick-wizard__custom-form">
              <label className="roomio-field">
                <span>Başlık</span>
                <input className="roomio-input" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Örn. VIP listesi" />
              </label>
              <label className="roomio-field">
                <span>Adres (URL)</span>
                <input className="roomio-input" value={customHref} onChange={(e) => setCustomHref(e.target.value)} placeholder="/guest-relations/vip" />
              </label>
              <label className="roomio-field">
                <span>Klavye tuşu (isteğe bağlı)</span>
                <input className="roomio-input" value={customKey} onChange={(e) => setCustomKey(e.target.value.toUpperCase())} placeholder="F4" />
              </label>
            </div>
            <button
              type="button"
              className="roomio-btn roomio-btn--secondary"
              disabled={!customLabel.trim() || !customHref.trim() || items.length >= QUICK_ACTION_MAX_ITEMS}
              onClick={addCustomItem}
            >
              <Plus size={14} /> Özel kısayolu ekle
            </button>
          </div>
        ) : null}

        <div className="roomio-modal__actions roomio-quick-wizard__actions">
          <button
            type="button"
            className="roomio-btn roomio-btn--ghost"
            disabled={step === 1}
            onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev))}
          >
            <ChevronLeft size={14} /> Geri
          </button>
          <button
            type="button"
            className="roomio-btn roomio-btn--ghost"
            disabled={step === 3}
            onClick={() => setStep((prev) => (prev < 3 ? ((prev + 1) as WizardStep) : prev))}
          >
            İleri <ChevronRight size={14} />
          </button>
          <span className="roomio-quick-wizard__spacer" />
          <button type="button" className="roomio-btn roomio-btn--secondary" onClick={() => setItems(DEFAULT_QUICK_ACTIONS)}>
            Varsayılana dön
          </button>
          <button type="button" className="roomio-btn roomio-btn--primary" onClick={save}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
