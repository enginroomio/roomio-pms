'use client';

import { useState } from 'react';
import {
  Archive,
  Bookmark,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Plus,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type { RezListColumnId } from '@/lib/reservations/list-columns';
import {
  DEFAULT_REZ_COLUMN_WIDTHS,
  REZ_COLUMN_MAX_WIDTH,
  REZ_COLUMN_MIN_WIDTH,
  REZ_LIST_COLUMN_LABELS,
} from '@/lib/reservations/list-columns';
import { REZ_LIST_PRESETS, type RezListLayout, type RezListPresetId } from '@/lib/reservations/list-layout';
import type { RezListUserTemplate } from '@/lib/reservations/list-templates';

type Props = {
  open: boolean;
  layout: RezListLayout;
  archive: RezListUserTemplate[];
  defaultTemplateId: string | null;
  onClose: () => void;
  onApplyPreset: (presetId: RezListPresetId) => void;
  onApplyTemplate: (templateId: string) => void;
  onPatch: (patch: Partial<RezListLayout>) => void;
  onMoveColumn: (columnId: RezListColumnId, direction: 'up' | 'down') => void;
  onResizeColumn: (columnId: RezListColumnId, width: number) => void;
  onResetColumnWidths: () => void;
  onSaveTemplate: (name: string, description?: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onPinDefault: (templateId: string | null) => void;
  onOpenReservationWizard: () => void;
};

export function ReservationListDesignWizard({
  open,
  layout,
  archive,
  defaultTemplateId,
  onClose,
  onApplyPreset,
  onApplyTemplate,
  onPatch,
  onMoveColumn,
  onResizeColumn,
  onResetColumnWidths,
  onSaveTemplate,
  onDeleteTemplate,
  onPinDefault,
  onOpenReservationWizard,
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
    <div className="roomio-rez-design-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="roomio-rez-design-wizard roomio-rez-design-wizard--wide"
        role="dialog"
        aria-labelledby="rez-design-wizard-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="roomio-rez-design-wizard__head">
          <div>
            <p className="roomio-rez-design-wizard__eyebrow">Liste Dizayn Sihirbazı</p>
            <h2 id="rez-design-wizard-title">Rezervasyon Listesi Görünümü</h2>
            <p className="roomio-rez-design-wizard__sub">
              Başlık satırını sürükleyerek sırayı değiştirin, kenardan tutarak genişliği ayarlayın veya buradan ince ayar yapın.
            </p>
          </div>
          <button type="button" className="roomio-rez-design-wizard__close" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <div className="roomio-rez-design-wizard__actions-row">
          <button
            type="button"
            className="roomio-btn roomio-btn--primary roomio-btn--sm"
            onClick={() => {
              onClose();
              onOpenReservationWizard();
            }}
          >
            <Wand2 size={14} aria-hidden />
            Rezervasyon Sihirbazı
          </button>
        </div>

        <section className="roomio-rez-design-wizard__presets">
          <h3>
            <LayoutTemplate size={16} aria-hidden /> Hazır tasarımlar
          </h3>
          <div className="roomio-rez-design-wizard__grid">
            {REZ_LIST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`roomio-rez-design-wizard__card${layout.presetId === preset.id ? ' is-active' : ''}`}
                onClick={() => onApplyPreset(preset.id)}
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="roomio-rez-design-wizard__presets">
          <h3>
            <Archive size={16} aria-hidden /> Arşiv — kayıtlı dizaynlar
          </h3>
          <div className="roomio-rez-design-wizard__archive">
            {archive.map((tpl) => (
              <div
                key={tpl.id}
                className={`roomio-rez-design-wizard__archive-item${layout.presetId === tpl.id ? ' is-active' : ''}${defaultTemplateId === tpl.id ? ' is-default' : ''}`}
              >
                <button type="button" className="roomio-rez-design-wizard__archive-main" onClick={() => onApplyTemplate(tpl.id)}>
                  <strong>{tpl.name}</strong>
                  {tpl.description ? <span>{tpl.description}</span> : null}
                  <em>{new Date(tpl.createdAt).toLocaleDateString('tr-TR')}</em>
                </button>
                <div className="roomio-rez-design-wizard__archive-actions">
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

        <section className="roomio-rez-design-wizard__options">
          <h3>Sütun sırası</h3>
          <ol className="roomio-rez-design-wizard__columns">
            {layout.columnOrder.map((columnId, index) => (
              <li key={columnId} className="roomio-rez-design-wizard__column-row">
                <span className="roomio-rez-design-wizard__column-index">{index + 1}</span>
                <span className="roomio-rez-design-wizard__column-label">{REZ_LIST_COLUMN_LABELS[columnId]}</span>
                <div className="roomio-rez-design-wizard__column-move">
                  <button
                    type="button"
                    className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                    disabled={index === 0}
                    aria-label={`${REZ_LIST_COLUMN_LABELS[columnId]} yukarı`}
                    onClick={() => onMoveColumn(columnId, 'up')}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="roomio-btn roomio-btn--ghost roomio-btn--sm"
                    disabled={index === layout.columnOrder.length - 1}
                    aria-label={`${REZ_LIST_COLUMN_LABELS[columnId]} aşağı`}
                    onClick={() => onMoveColumn(columnId, 'down')}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="roomio-rez-design-wizard__options">
          <div className="roomio-rez-design-wizard__widths-head">
            <h3>Sütun genişlikleri (px)</h3>
            <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={onResetColumnWidths}>
              Elektra varsayılanı
            </button>
          </div>
          <div className="roomio-rez-design-wizard__widths">
            {layout.columnOrder.map((columnId) => {
              const width = layout.columnWidths[columnId] ?? DEFAULT_REZ_COLUMN_WIDTHS[columnId];
              return (
                <label key={columnId} className="roomio-rez-design-wizard__width-row">
                  <span>{REZ_LIST_COLUMN_LABELS[columnId]}</span>
                  <input
                    type="range"
                    min={REZ_COLUMN_MIN_WIDTH}
                    max={REZ_COLUMN_MAX_WIDTH}
                    value={width}
                    onChange={(e) => onResizeColumn(columnId, Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="roomio-input roomio-input--compact"
                    min={REZ_COLUMN_MIN_WIDTH}
                    max={REZ_COLUMN_MAX_WIDTH}
                    value={width}
                    onChange={(e) => onResizeColumn(columnId, Number(e.target.value))}
                  />
                </label>
              );
            })}
          </div>
        </section>

        <section className="roomio-rez-design-wizard__options">
          <h3>Görünüm ayarları</h3>
          <label className="roomio-rez-design-wizard__check">
            <input
              type="checkbox"
              checked={layout.filtersDefaultOpen}
              onChange={(e) => onPatch({ filtersDefaultOpen: e.target.checked })}
            />
            Filtre paneli varsayılan açık
          </label>
          <label className="roomio-rez-design-wizard__check">
            <input
              type="radio"
              name="rez-density"
              checked={layout.density === 'dense'}
              onChange={() => onPatch({ density: 'dense' })}
            />
            Yoğun satır (Elektra)
          </label>
          <label className="roomio-rez-design-wizard__check">
            <input
              type="radio"
              name="rez-density"
              checked={layout.density === 'comfortable'}
              onChange={() => onPatch({ density: 'comfortable' })}
            />
            Rahat satır aralığı
          </label>
        </section>

        <section className="roomio-rez-design-wizard__save">
          <h3>
            <Plus size={16} aria-hidden /> Mevcut dizaynı arşive kaydet
          </h3>
          <div className="roomio-rez-design-wizard__save-form">
            <input
              className="roomio-input"
              placeholder="Şablon adı (ör. Gece vardiyası)"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <input
              className="roomio-input"
              placeholder="Açıklama (isteğe bağlı)"
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
            />
            <button type="button" className="roomio-btn roomio-btn--secondary roomio-btn--sm" onClick={handleSaveTemplate}>
              Kaydet
            </button>
          </div>
        </section>

        <footer className="roomio-rez-design-wizard__foot">
          <span className="roomio-rez-design-wizard__hint">
            Aktif: <strong>{layout.presetId === 'custom' ? 'Özel' : layout.presetId}</strong>
            {defaultTemplateId ? (
              <> · Varsayılan: <strong>{archive.find((t) => t.id === defaultTemplateId)?.name ?? defaultTemplateId}</strong></>
            ) : null}
          </span>
          <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" onClick={onClose}>
            Uygula ve kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
