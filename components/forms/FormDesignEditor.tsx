'use client';

import { useCallback, useMemo, useState } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  FORM_PAGES,
  defaultFormLayout,
  formFieldLabel,
  formPageById,
  layoutFieldKeys,
  type FormFieldConfig,
  type FormLayout,
  type FormPageDef,
} from '@/lib/forms/form-catalog';

export type FormTemplateDraft = {
  id: string;
  name: string;
  pageId: string;
  module: string;
  columns: string[];
  layout: FormLayout;
  updatedAt: string;
};

type Props = {
  value: FormTemplateDraft;
  onChange: (next: FormTemplateDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function FormDesignEditor({ value, onChange, onSave, onCancel }: Props) {
  const [activeStep, setActiveStep] = useState(value.layout.steps[0]?.id ?? 'guest');
  const [customLabel, setCustomLabel] = useState('');
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const page = useMemo(() => formPageById(value.pageId) ?? FORM_PAGES[0], [value.pageId]);
  const catalog = useMemo(() => {
    const used = new Set(value.layout.fields.map((f) => f.key));
    return page.fields.filter((f) => !used.has(f.key));
  }, [page.fields, value.layout.fields]);

  const stepFields = useMemo(
    () => value.layout.fields.filter((f) => f.stepId === activeStep),
    [value.layout.fields, activeStep],
  );

  const setPage = useCallback((p: FormPageDef) => {
    const layout = defaultFormLayout(p.id) ?? { steps: p.steps, fields: [] };
    onChange({
      ...value,
      pageId: p.id,
      module: p.label,
      name: value.name || `${p.label} formu`,
      layout,
      columns: layoutFieldKeys(layout),
    });
    setActiveStep(layout.steps[0]?.id ?? 'main');
  }, [onChange, value]);

  const applyLayout = useCallback((layout: FormLayout) => {
    onChange({ ...value, layout, columns: layoutFieldKeys(layout) });
  }, [onChange, value]);

  const addField = useCallback((key: string, custom = false) => {
    if (value.layout.fields.some((f) => f.key === key)) return;
    const def = page.fields.find((f) => f.key === key);
    const field: FormFieldConfig = {
      key,
      stepId: activeStep,
      label: def?.label,
      required: key === 'guestName',
      width: def?.type === 'textarea' ? 'full' : 'half',
      custom,
      type: def?.type,
      options: def?.options,
    };
    applyLayout({ ...value.layout, fields: [...value.layout.fields, field] });
  }, [activeStep, applyLayout, page.fields, value.layout]);

  const removeField = useCallback((key: string) => {
    applyLayout({ ...value.layout, fields: value.layout.fields.filter((f) => f.key !== key) });
  }, [applyLayout, value.layout]);

  const moveField = useCallback((fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const keys = value.layout.fields.filter((f) => f.stepId === activeStep).map((f) => f.key);
    const fromIdx = keys.indexOf(fromKey);
    const toIdx = keys.indexOf(toKey);
    if (fromIdx < 0 || toIdx < 0) return;
    keys.splice(fromIdx, 1);
    keys.splice(toIdx, 0, fromKey);
    const fieldMap = new Map(value.layout.fields.map((f) => [f.key, f]));
    let stepCursor = 0;
    const fields = value.layout.fields.map((f) => {
      if (f.stepId !== activeStep) return f;
      return fieldMap.get(keys[stepCursor++]) ?? f;
    });
    applyLayout({ ...value.layout, fields });
  }, [activeStep, applyLayout, value.layout.fields]);

  const addCustomField = useCallback(() => {
    const label = customLabel.trim();
    if (!label) return;
    const key = `custom_${Date.now()}`;
    applyLayout({
      ...value.layout,
      fields: [...value.layout.fields, {
        key,
        stepId: activeStep,
        label,
        required: false,
        width: 'half' as const,
        custom: true,
        type: 'text' as const,
      }],
    });
    setCustomLabel('');
  }, [activeStep, applyLayout, customLabel, value.layout]);

  const addStep = useCallback(() => {
    const id = `step-${Date.now()}`;
    applyLayout({
      ...value.layout,
      steps: [...value.layout.steps, { id, title: 'Yeni adım', description: '' }],
    });
    setActiveStep(id);
  }, [applyLayout, value.layout]);

  return (
    <div className="roomio-form-designer roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-report-designer__meta">
        <label className="roomio-field">
          <span>Form adı</span>
          <input className="roomio-input" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        </label>
        <label className="roomio-field">
          <span>Sayfa</span>
          <select className="roomio-select" value={value.pageId} onChange={(e) => {
            const p = formPageById(e.target.value);
            if (p) setPage(p);
          }}>
            {FORM_PAGES.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
          </select>
        </label>
      </div>

      <section className="roomio-report-designer__section">
        <h3 className="roomio-report-designer__section-title">Sihirbaz adımları</h3>
        <div className="roomio-report-dept-grid">
          {value.layout.steps.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`roomio-report-dept-card${s.id === activeStep ? ' is-active' : ''}`}
              onClick={() => setActiveStep(s.id)}
            >
              <strong>{s.title}</strong>
              <small>{value.layout.fields.filter((f) => f.stepId === s.id).length} alan</small>
            </button>
          ))}
          <button type="button" className="roomio-report-dept-card" onClick={addStep}>
            <Plus size={16} /> Adım ekle
          </button>
        </div>
      </section>

      <div className="roomio-report-designer__workspace">
        <section
          className="roomio-card roomio-report-designer__columns"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragKey && !value.layout.fields.some((f) => f.key === dragKey)) addField(dragKey);
            setDragKey(null);
            setOverKey(null);
          }}
        >
          <h4>Adım alanları — {value.layout.steps.find((s) => s.id === activeStep)?.title}</h4>
          <p className="roomio-page-desc">Katalogdan sürükleyin veya tıklayın. Sıralamak için alanı sürükleyin.</p>
          {stepFields.length === 0 ? <p className="roomio-page-desc">Sağdan alan ekleyin veya özel alan tanımlayın.</p> : null}
          <ul className="roomio-report-field-list">
            {stepFields.map((f) => (
              <li
                key={f.key}
                className={`roomio-report-field roomio-report-field--selected${overKey === f.key ? ' is-drop-target' : ''}${dragKey === f.key ? ' is-dragging' : ''}`}
                draggable
                onDragStart={() => setDragKey(f.key)}
                onDragEnd={() => { setDragKey(null); setOverKey(null); }}
                onDragOver={(e) => { e.preventDefault(); setOverKey(f.key); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragKey) {
                    if (value.layout.fields.some((x) => x.key === dragKey) && dragKey !== f.key) moveField(dragKey, f.key);
                    else if (!value.layout.fields.some((x) => x.key === dragKey)) addField(dragKey);
                  }
                  setDragKey(null);
                  setOverKey(null);
                }}
              >
                <GripVertical size={14} aria-hidden />
                <span className="roomio-report-field__label">
                  {f.label ?? formFieldLabel(value.pageId, f.key)}
                  {f.custom ? ' · özel' : ''}
                  {f.required ? ' *' : ''}
                </span>
                <button type="button" className="roomio-report-field__remove" onClick={() => removeField(f.key)} aria-label="Kaldır">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="roomio-form-grid" style={{ marginTop: 12 }}>
            <input className="roomio-input" placeholder="Özel alan adı" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
            <Button variant="secondary" onClick={addCustomField}>Özel alan ekle</Button>
          </div>
        </section>

        <section className="roomio-card roomio-report-designer__palette">
          <h4>Katalog — {page.label}</h4>
          <ul className="roomio-report-palette">
            {catalog.map((f) => (
              <li key={f.key}>
                <button
                  type="button"
                  className="roomio-report-palette__btn roomio-report-field--palette"
                  draggable
                  onDragStart={() => setDragKey(f.key)}
                  onDragEnd={() => { setDragKey(null); setOverKey(null); }}
                  onClick={() => addField(f.key)}
                >
                  <Plus size={14} /> {f.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="roomio-form-actions">
        <Button variant="secondary" onClick={onCancel}>İptal</Button>
        <Button onClick={onSave}>Form şablonunu kaydet</Button>
      </div>
    </div>
  );
}
