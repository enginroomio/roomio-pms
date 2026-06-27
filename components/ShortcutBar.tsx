'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, GripVertical, Plus, Settings2, X } from 'lucide-react';
import {
  DEFAULT_USER_SHORTCUTS,
  readUserShortcuts,
  resolvedShortcuts,
  saveUserShortcuts,
  SHORTCUT_CATALOG,
  SHORTCUT_ICON_MAP,
  type UserShortcut,
} from '@/lib/shortcuts/user-shortcuts';
import { DailyFxStrip } from '@/components/exchange/DailyFxStrip';
import { useViewport } from '@/components/ViewportProvider';
import { DEMO_USER, PROPERTY } from '@/lib/navigation';

function formatBusinessDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ShortcutEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<UserShortcut[]>(DEFAULT_USER_SHORTCUTS);

  useEffect(() => {
    if (open) setItems(readUserShortcuts());
  }, [open]);

  if (!open) return null;

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function add(catalogId: string) {
    if (items.some((i) => i.catalogId === catalogId)) return;
    const cat = SHORTCUT_CATALOG.find((c) => c.id === catalogId);
    setItems((prev) => [
      ...prev,
      { id: `u-${Date.now().toString(36)}`, catalogId, key: cat?.key ?? '' },
    ]);
  }

  function save() {
    saveUserShortcuts(items);
    onClose();
  }

  const used = new Set(items.map((i) => i.catalogId));

  return (
    <div className="roomio-modal-backdrop" role="dialog" aria-modal="true" aria-label="Hızlı menü düzenle">
      <div className="roomio-modal roomio-modal--wide">
        <div className="roomio-modal__head">
          <h2>Hızlı Menüyü Düzenle</h2>
          <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={onClose} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
        <p className="roomio-page-desc">Kısayolları sıralayın, ekleyin veya kaldırın. Klavye tuşları (F2, F3…) isteğe bağlıdır.</p>

        <div className="roomio-shortcut-editor">
          <div className="roomio-shortcut-editor__list">
            <h3>Aktif kısayollar</h3>
            {items.length === 0 ? <p className="roomio-page-desc">Henüz kısayol yok.</p> : null}
            {items.map((item, index) => {
              const cat = SHORTCUT_CATALOG.find((c) => c.id === item.catalogId);
              if (!cat) return null;
              return (
                <div key={item.id} className="roomio-shortcut-editor__row">
                  <GripVertical size={14} className="roomio-shortcut-editor__grip" aria-hidden />
                  <span className="roomio-shortcut-editor__label">{cat.label}</span>
                  <input
                    className="roomio-input roomio-shortcut-editor__key"
                    value={item.key}
                    placeholder="F2"
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === item.id ? { ...x, key: e.target.value.toUpperCase() } : x)),
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

          <div className="roomio-shortcut-editor__catalog">
            <h3>Eklenebilir</h3>
            {SHORTCUT_CATALOG.filter((c) => !used.has(c.id)).map((cat) => (
              <button key={cat.id} type="button" className="roomio-shortcut-editor__add" onClick={() => add(cat.id)}>
                <Plus size={14} /> {cat.label}
                <small>{cat.category}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="roomio-modal__actions">
          <button type="button" className="roomio-btn roomio-btn--secondary" onClick={() => setItems(DEFAULT_USER_SHORTCUTS)}>
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

export function ShortcutBar() {
  const viewport = useViewport();
  const [shortcuts, setShortcuts] = useState(resolvedShortcuts());
  const [editorOpen, setEditorOpen] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    function refresh() {
      setShortcuts(resolvedShortcuts());
    }
    refresh();
    window.addEventListener('roomio-shortcuts-changed', refresh);
    return () => window.removeEventListener('roomio-shortcuts-changed', refresh);
  }, []);

  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <footer className="roomio-status-footer" aria-label="Durum çubuğu">
        <div className="roomio-status-footer__row roomio-status-footer__row--main">
          <div className="roomio-status-footer__left">
            <span className="roomio-status-footer__item">
              <strong>İş Tarihi:</strong> {formatBusinessDate(PROPERTY.businessDate)}
            </span>
            <span className="roomio-status-footer__item">
              <strong>Saat:</strong> {clock || '—'}
            </span>
            <span className="roomio-status-footer__item roomio-status-footer__item--muted">
              {DEMO_USER.name} · {DEMO_USER.role}
            </span>
            {viewport ? (
              <span className="roomio-status-footer__item roomio-status-footer__viewport" title="Otomatik ekran boyutu">
                {viewport.width}×{viewport.height}
                {viewport.fitActive ? ` · %${Math.round(viewport.fitScale * 100)}` : ' · tam ekran'}
              </span>
            ) : null}
          </div>

          <div className="roomio-status-footer__shortcuts">
            {shortcuts.map((item) => {
              const Icon = SHORTCUT_ICON_MAP[item.icon] ?? SHORTCUT_ICON_MAP.search;
              return (
                <Link
                  key={item.userId}
                  href={item.href}
                  className="roomio-shortcut-bar__btn"
                  title={item.key ? `${item.label} (${item.key})` : item.label}
                >
                  {item.key ? <kbd>{item.key}</kbd> : null}
                  <Icon size={14} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              className="roomio-shortcut-bar__btn roomio-shortcut-bar__edit"
              onClick={() => setEditorOpen(true)}
              title="Hızlı menüyü düzenle"
            >
              <Settings2 size={14} aria-hidden />
              <span>Düzenle</span>
            </button>
          </div>
        </div>

        <div className="roomio-status-footer__row roomio-status-footer__row--fx">
          <span className="roomio-status-footer__fx-label">Günlük kur (TCMB alış)</span>
          <DailyFxStrip variant="elektra" />
        </div>
      </footer>
      <ShortcutEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </>
  );
}
