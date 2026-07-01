'use client';

import { useCallback, useMemo, useState } from 'react';
import { GripVertical, HelpCircle, Plus, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  REPORT_MODULES,
  LIVE_DATA_MODULES,
  fieldGroups,
  fieldLabel,
  moduleByLabel,
  previewRows,
  type ReportFieldDef,
  type ReportModuleDef,
  type ReportStarter,
} from '@/lib/reports/field-catalog';

export type ReportTemplateDraft = {
  id: string;
  name: string;
  module: string;
  columns: string[];
  updatedAt: string;
};

type Props = {
  value: ReportTemplateDraft;
  onChange: (next: ReportTemplateDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ReportDesignEditor({ value, onChange, onSave, onCancel }: Props) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [starterSearch, setStarterSearch] = useState('');
  const [showHelp, setShowHelp] = useState(true);

  const mod = useMemo(() => moduleByLabel(value.module) ?? REPORT_MODULES[0], [value.module]);
  const groups = useMemo(() => fieldGroups(value.module), [value.module]);
  const preview = useMemo(() => previewRows(value.module, value.columns), [value.module, value.columns]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        fields: g.fields.filter(
          (f) => f.label.toLowerCase().includes(q) || (f.group ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.fields.length > 0);
  }, [groups, search]);

  const groupedStarters = useMemo(() => {
    const q = starterSearch.trim().toLowerCase();
    const list = mod.starters.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q)
        || (s.reportCode ?? '').toLowerCase().includes(q)
        || (s.group ?? '').toLowerCase().includes(q)
        || s.id.toLowerCase().includes(q)
      );
    });
    if (mod.id !== 'eod') {
      return [{ group: 'Hazır şablonlar', starters: list }];
    }
    const map = new Map<string, ReportStarter[]>();
    for (const s of list) {
      const g = s.group ?? 'Diğer';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return Array.from(map.entries()).map(([group, starters]) => ({ group, starters }));
  }, [mod, starterSearch]);

  const availableCount = useMemo(
    () => mod.fields.filter((f) => !value.columns.includes(f.key)).length,
    [mod.fields, value.columns],
  );

  const setModule = useCallback(
    (m: ReportModuleDef, resetColumns = false) => {
      onChange({
        ...value,
        module: m.label,
        name: value.name || `${m.label} raporu`,
        columns: resetColumns ? [...m.defaultColumns] : value.columns,
      });
      setSearch('');
    },
    [onChange, value],
  );

  const applyStarter = useCallback(
    (starter: ReportStarter, m: ReportModuleDef) => {
      onChange({
        ...value,
        module: m.label,
        name: starter.name,
        columns: [...starter.columns],
      });
      setSearch('');
    },
    [onChange, value],
  );

  const addColumn = useCallback(
    (key: string) => {
      if (value.columns.includes(key)) return;
      onChange({ ...value, columns: [...value.columns, key] });
    },
    [onChange, value],
  );

  const removeColumn = useCallback(
    (key: string) => onChange({ ...value, columns: value.columns.filter((c) => c !== key) }),
    [onChange, value],
  );

  const moveColumn = useCallback(
    (from: string, to: string) => {
      if (from === to) return;
      const cols = [...value.columns];
      const fromIdx = cols.indexOf(from);
      const toIdx = cols.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return;
      cols.splice(fromIdx, 1);
      cols.splice(toIdx, 0, from);
      onChange({ ...value, columns: cols });
    },
    [onChange, value],
  );

  function PaletteField({ field }: { field: ReportFieldDef }) {
    const used = value.columns.includes(field.key);
    if (used) return null;
    return (
      <button
        type="button"
        className="roomio-report-field roomio-report-field--palette"
        draggable
        onDragStart={() => setDragKey(field.key)}
        onDragEnd={() => { setDragKey(null); setOverKey(null); }}
        onClick={() => addColumn(field.key)}
        title={`${field.label} ekle`}
      >
        <Plus size={14} aria-hidden />
        <span>{field.label}</span>
      </button>
    );
  }

  return (
    <div className="roomio-report-designer">
      {showHelp ? (
        <div className="roomio-report-help">
          <HelpCircle size={18} aria-hidden />
          <div>
            <strong>3 adımda rapor tasarlayın:</strong>
            {' '}1) Departman seçin veya hazır şablona tıklayın → 2) İstediğiniz bilgileri ekleyin → 3) Önizlemeyi kontrol edip kaydedin.
          </div>
          <button type="button" className="roomio-report-help__close" onClick={() => setShowHelp(false)} aria-label="Kapat">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section className="roomio-report-designer__section">
        <h3 className="roomio-report-designer__section-title">1. Hangi departman?</h3>
        <p className="roomio-page-desc">{mod.hint}</p>
        <div className="roomio-report-dept-grid">
          {REPORT_MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`roomio-report-dept-card${m.label === value.module ? ' is-active' : ''}`}
              onClick={() => setModule(m, value.columns.length === 0)}
            >
              <span className="roomio-report-dept-card__emoji" aria-hidden>{m.emoji}</span>
              <strong>{m.label}</strong>
              {LIVE_DATA_MODULES.has(m.label) ? (
                <span className="roomio-badge roomio-badge--success">Canlı veri</span>
              ) : (
                <span className="roomio-badge roomio-badge--muted">Örnek veri</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="roomio-report-designer__section">
        <h3 className="roomio-report-designer__section-title">
          <Sparkles size={16} aria-hidden /> 2. Hazır şablonla başla (isteğe bağlı)
        </h3>
        {mod.id === 'eod' ? (
          <p className="roomio-page-desc">
            Elektra GR gün sonu raporları — {mod.starters.length} şablon. Kod veya başlıkla arayın.
          </p>
        ) : null}
        <div className="roomio-report-palette-search" style={{ marginBottom: 12 }}>
          <Search size={16} aria-hidden />
          <input
            className="roomio-input"
            placeholder={mod.id === 'eod' ? 'GR kodu veya rapor adı ara… (örn. GR310, polis, kasa)' : 'Şablon ara…'}
            value={starterSearch}
            onChange={(e) => setStarterSearch(e.target.value)}
            aria-label="Hazır şablon ara"
          />
        </div>
        {groupedStarters.map(({ group, starters }) => (
          <div key={group} className="roomio-report-starter-group">
            {mod.id === 'eod' ? (
              <h4 className="roomio-report-starter-group__title">{group}</h4>
            ) : null}
            <div className="roomio-report-starters">
              {starters.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`roomio-report-starter-card${value.name === s.name ? ' is-active' : ''}`}
                  onClick={() => applyStarter(s, mod)}
                >
                  {s.reportCode ? (
                    <code className="roomio-report-starter-card__code">{s.reportCode}</code>
                  ) : null}
                  <strong>{s.name}</strong>
                  <span>{s.description}</span>
                  <em>{s.columns.length} sütun</em>
                </button>
              ))}
            </div>
          </div>
        ))}
        {groupedStarters.every((g) => g.starters.length === 0) ? (
          <p className="roomio-page-desc">Aramanızla eşleşen şablon bulunamadı.</p>
        ) : null}
      </section>

      <div className="roomio-report-designer__meta">
        <label className="roomio-field">
          <span>Rapor adı</span>
          <input
            className="roomio-input"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Örn. Haziran konaklayanlar listesi"
          />
        </label>
        <div className="roomio-form-actions roomio-report-designer__actions">
          <Button onClick={onSave} disabled={!value.name.trim() || value.columns.length === 0}>
            Raporu kaydet
          </Button>
          <Button variant="secondary" onClick={onCancel}>Vazgeç</Button>
        </div>
      </div>

      <section className="roomio-report-designer__section">
        <h3 className="roomio-report-designer__section-title">3. Sütunları düzenle</h3>
        <div className="roomio-report-designer__workspace">
          <aside className="roomio-report-designer__panel">
            <div className="roomio-report-palette-search">
              <Search size={16} aria-hidden />
              <input
                className="roomio-input"
                placeholder="Alan ara… (misafir, tarih, fiyat)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="roomio-page-desc">{availableCount} alan eklenebilir — tıklayın veya sürükleyin.</p>
            <div className="roomio-report-palette">
              {filteredGroups.map((g) => (
                <div key={g.group} className="roomio-report-palette-group">
                  <h4 className="roomio-report-palette-group__title">{g.group}</h4>
                  <div className="roomio-report-palette-group__fields">
                    {g.fields.map((f) => <PaletteField key={f.key} field={f} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="roomio-report-palette-actions">
              <Button
                variant="ghost"
                onClick={() => onChange({ ...value, columns: mod.fields.map((f) => f.key) })}
              >
                Tümünü ekle
              </Button>
              <Button variant="ghost" onClick={() => onChange({ ...value, columns: [...mod.defaultColumns] })}>
                Varsayılana dön
              </Button>
              <Button variant="ghost" onClick={() => onChange({ ...value, columns: [] })}>
                Temizle
              </Button>
            </div>
          </aside>

          <section className="roomio-report-designer__panel roomio-report-designer__canvas-wrap">
            <h4 className="roomio-report-designer__panel-title">Raporunuzda görünecek sütunlar</h4>
            <p className="roomio-page-desc">Sıralamak için tutup sürükleyin. Çıkarmak için ×.</p>
            <div
              className="roomio-report-canvas"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKey && !value.columns.includes(dragKey)) addColumn(dragKey);
                setDragKey(null);
                setOverKey(null);
              }}
            >
              {value.columns.length === 0 ? (
                <p className="roomio-report-canvas__empty">
                  Soldan alan seçin veya yukarıdaki hazır şablondan birine tıklayın.
                </p>
              ) : (
                value.columns.map((key, idx) => (
                  <div
                    key={key}
                    className={`roomio-report-field roomio-report-field--selected${overKey === key ? ' is-drop-target' : ''}${dragKey === key ? ' is-dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragKey(key)}
                    onDragEnd={() => { setDragKey(null); setOverKey(null); }}
                    onDragOver={(e) => { e.preventDefault(); setOverKey(key); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragKey) {
                        if (value.columns.includes(dragKey) && dragKey !== key) moveColumn(dragKey, key);
                        else if (!value.columns.includes(dragKey)) addColumn(dragKey);
                      }
                      setDragKey(null);
                      setOverKey(null);
                    }}
                  >
                    <GripVertical size={16} className="roomio-report-field__grip" aria-hidden />
                    <span className="roomio-report-field__order">{idx + 1}</span>
                    <span className="roomio-report-field__label">{fieldLabel(value.module, key)}</span>
                    <button
                      type="button"
                      className="roomio-report-field__remove"
                      onClick={() => removeColumn(key)}
                      aria-label={`${fieldLabel(value.module, key)} kaldır`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="roomio-report-designer__panel roomio-report-designer__preview-wrap">
            <h4 className="roomio-report-designer__panel-title">Önizleme</h4>
            <p className="roomio-page-desc">Raporunuz böyle görünecek ({value.columns.length} sütun)</p>
            {preview.length > 0 ? (
              <div className="roomio-table-wrap roomio-report-preview">
                <table className="roomio-table">
                  <thead>
                    <tr>
                      {value.columns.map((col) => (
                        <th key={col}>{fieldLabel(value.module, col)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {value.columns.map((col) => (
                          <td key={col}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="roomio-page-desc">Henüz sütun yok.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
