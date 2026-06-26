'use client';

import { useState } from 'react';
import { Archive, Bookmark, LayoutTemplate, RotateCcw, Trash2, X } from 'lucide-react';
import {
  HOME_PANEL_LABELS,
  HOME_PRESETS,
  HOME_THEME_LABELS,
  type HomeLayout,
  type HomePanelId,
  type HomePresetId,
  type HomeThemeId,
} from '@/lib/dashboard/home-layout';
import type { HomeUserTemplate } from '@/lib/dashboard/home-templates';

type Props = {
  open: boolean;
  layout: HomeLayout;
  archive: HomeUserTemplate[];
  defaultTemplateId: string | null;
  onClose: () => void;
  onApplyPreset: (presetId: HomePresetId) => void;
  onApplyTemplate: (templateId: string) => void;
  onResetTemplate: () => void;
  onPatch: (patch: Partial<HomeLayout>) => void;
  onTogglePanel: (panelId: HomePanelId, visible: boolean) => void;
  onSaveTemplate: (name: string, description?: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onPinDefault: (templateId: string | null) => void;
};

const THEME_OPTIONS = Object.keys(HOME_THEME_LABELS) as HomeThemeId[];

function activeLabel(layout: HomeLayout, archive: HomeUserTemplate[]): string {
  if (layout.presetId === 'custom') return 'Özel düzen';
  const tpl = archive.find((t) => t.id === layout.presetId);
  if (tpl) return tpl.name;
  const preset = HOME_PRESETS.find((p) => p.id === layout.presetId);
  return preset?.label ?? layout.presetId;
}

export function HomeDesignWizard({
  open,
  layout,
  archive,
  defaultTemplateId,
  onClose,
  onApplyPreset,
  onApplyTemplate,
  onResetTemplate,
  onPatch,
  onTogglePanel,
  onSaveTemplate,
  onDeleteTemplate,
  onPinDefault,
}: Props) {
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');

  if (!open) return null;

  function handleSaveTemplate() {
    const name = saveName.trim();
    if (!name) return;
    onSaveTemplate(name, saveDesc.trim() || undefined);
    setSaveName('');
    setSaveDesc('');
  }

  return (
    <div className="roomio-home-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="roomio-home-wizard roomio-home-wizard--wide"
        role="dialog"
        aria-labelledby="home-design-wizard-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="roomio-home-wizard__head">
          <div>
            <p className="roomio-home-wizard__eyebrow">Ana Ekran Dizayn Sihirbazı</p>
            <h2 id="home-design-wizard-title">Görünüm & şablonlar</h2>
            <p className="roomio-home-wizard__sub">
              Hazır modern tasarımlardan birini seçin, arşivden uygulayın, panelleri göster/gizle ve sürükleyerek sıralayın.
              Tercihleriniz bu cihazda saklanır.
            </p>
          </div>
          <button type="button" className="roomio-home-wizard__close" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <section className="roomio-home-wizard__presets">
          <h3>
            <LayoutTemplate size={16} aria-hidden /> Hızlı şablonlar
          </h3>
          <div className="roomio-home-wizard__grid">
            {HOME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`roomio-home-wizard__card roomio-home-wizard__card--${preset.preview}${layout.presetId === preset.id ? ' is-active' : ''}`}
                onClick={() => onApplyPreset(preset.id)}
              >
                <LayoutTemplate size={18} aria-hidden />
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="roomio-home-wizard__presets">
          <h3>
            <Archive size={16} aria-hidden /> Arşiv — 10 hazır ana ekran dizaynı
          </h3>
          <div className="roomio-home-wizard__archive">
            {archive.map((tpl) => (
              <div
                key={tpl.id}
                className={`roomio-home-wizard__archive-item${layout.presetId === tpl.id ? ' is-active' : ''}${defaultTemplateId === tpl.id ? ' is-default' : ''}`}
              >
                <button type="button" className="roomio-home-wizard__archive-main" onClick={() => onApplyTemplate(tpl.id)}>
                  <strong>{tpl.name}</strong>
                  {tpl.description ? <span>{tpl.description}</span> : null}
                  <em>
                    {tpl.layout.theme}
                    {' · '}
                    {tpl.layout.hiddenPanels.length
                      ? `${6 - tpl.layout.hiddenPanels.length} panel`
                      : '6 panel'}
                    {tpl.layout.showKpiStrip ? ' · KPI' : ''}
                  </em>
                </button>
                <div className="roomio-home-wizard__archive-actions">
                  <button
                    type="button"
                    className={`roomio-btn roomio-btn--ghost roomio-btn--sm${defaultTemplateId === tpl.id ? ' is-active' : ''}`}
                    title="Varsayılan yap"
                    onClick={() => onPinDefault(defaultTemplateId === tpl.id ? null : tpl.id)}
                  >
                    <Bookmark size={14} aria-hidden />
                  </button>
                  {!tpl.id.startsWith('builtin-') ? (
                    <button
                      type="button"
                      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                      title="Sil"
                      onClick={() => onDeleteTemplate(tpl.id)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="roomio-home-wizard__options">
          <h3>Görsel tema</h3>
          <div className="roomio-home-wizard__themes">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`roomio-home-wizard__theme roomio-home-wizard__theme--${theme}${layout.theme === theme ? ' is-active' : ''}`}
                onClick={() => onPatch({ theme })}
              >
                {HOME_THEME_LABELS[theme]}
              </button>
            ))}
          </div>

          <h3>Paneller</h3>
          <div className="roomio-home-wizard__panels">
            {(Object.keys(HOME_PANEL_LABELS) as HomePanelId[]).map((panelId) => {
              const visible = !layout.hiddenPanels.includes(panelId);
              return (
                <label key={panelId} className="roomio-home-wizard__panel-check">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => onTogglePanel(panelId, e.target.checked)}
                  />
                  {HOME_PANEL_LABELS[panelId]}
                </label>
              );
            })}
          </div>

          <label className="roomio-home-wizard__check">
            <input
              type="checkbox"
              checked={layout.rackExpanded}
              onChange={(e) => onPatch({ rackExpanded: e.target.checked })}
            />
            Oda rack kalan alanı doldursun
          </label>
          <label className="roomio-home-wizard__check">
            <input
              type="checkbox"
              checked={layout.showKpiStrip}
              onChange={(e) => onPatch({ showKpiStrip: e.target.checked })}
            />
            KPI şeridini her zaman göster
          </label>

          <h3>Mevcut düzeni kaydet</h3>
          <div className="roomio-home-wizard__save-row">
            <input
              type="text"
              className="roomio-input roomio-input--sm"
              placeholder="Dizayn adı"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <input
              type="text"
              className="roomio-input roomio-input--sm"
              placeholder="Açıklama (isteğe bağlı)"
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
            />
            <button
              type="button"
              className="roomio-btn roomio-btn--secondary roomio-btn--sm"
              disabled={!saveName.trim()}
              onClick={handleSaveTemplate}
            >
              Arşive ekle
            </button>
          </div>
        </section>

        <footer className="roomio-home-wizard__foot">
          <div className="roomio-home-wizard__foot-meta">
            <span>
              Aktif: <strong>{activeLabel(layout, archive)}</strong>
              {defaultTemplateId ? (
                <>
                  {' · '}
                  Varsayılan: <strong>{archive.find((t) => t.id === defaultTemplateId)?.name ?? defaultTemplateId}</strong>
                </>
              ) : null}
            </span>
            <button type="button" className="roomio-home-wizard__reset" onClick={onResetTemplate}>
              <RotateCcw size={14} aria-hidden />
              Ana Ekran Şablonuna dön
            </button>
          </div>
          <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={onClose}>
            Kaydet & Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
