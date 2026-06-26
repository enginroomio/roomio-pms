'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { FormTemplateDraft } from '@/components/forms/FormDesignEditor';
import { TemplateSharePanel } from '@/components/reports/TemplateSharePanel';
import { FORM_PAGES, defaultFormLayout, formPageById } from '@/lib/forms/form-catalog';
import { fieldLabel, LIVE_DATA_MODULES } from '@/lib/reports/field-catalog';

const editorLoading = () => <p className="roomio-page-desc">Editör yükleniyor…</p>;

const ReportDesignEditor = dynamic(
  () => import('@/components/reports/ReportDesignEditor').then((m) => m.ReportDesignEditor),
  { loading: editorLoading },
);
const FormDesignEditor = dynamic(
  () => import('@/components/forms/FormDesignEditor').then((m) => m.FormDesignEditor),
  { loading: editorLoading },
);
const ReportAiSuggest = dynamic(
  () => import('@/components/reports/ReportAiSuggest').then((m) => m.ReportAiSuggest),
  { loading: editorLoading },
);

type ReportTemplate = {
  id: string;
  name: string;
  module: string;
  columns: string[];
  kind?: 'report' | 'form';
  pageId?: string;
  layout?: FormTemplateDraft['layout'];
  updatedAt: string;
};

type TFn = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

export function ReportsDesignTabContent({
  t,
  activePropertyName,
  templates,
  editing,
  tplMsg,
  onStartNew,
  onEdit,
  onSave,
  onDelete,
  onTplMsg,
  exportTemplateHref,
}: {
  t: TFn;
  activePropertyName?: string;
  templates: ReportTemplate[];
  editing: ReportTemplate | null;
  tplMsg: string | null;
  onStartNew: () => void;
  onEdit: (tpl: ReportTemplate | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onTplMsg: (msg: string) => void;
  exportTemplateHref: (templateId: string, format: 'pdf' | 'csv') => string;
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">
            <LayoutTemplate size={18} /> {t('reports.templates')}
          </h2>
          <Button onClick={onStartNew}>{t('reports.newTemplate')}</Button>
        </div>
        {tplMsg ? <p className="roomio-page-desc">{tplMsg}</p> : null}
        <p className="roomio-page-desc">
          Teknik bilgi gerekmez — departman seçin, hazır şablona tıklayın veya alanları sürükleyin.
          Şablonları diğer otellere <strong>Paylaş</strong> ile kopyalayabilirsiniz.
          {' '}
          <strong>{activePropertyName ?? '—'}</strong>
        </p>
      </div>

      <ReportAiSuggest
        onApply={(s) => onEdit(editing ? { ...editing, ...s } : { id: '', updatedAt: '', ...s })}
      />

      {editing ? (
        <ReportDesignEditor
          value={editing}
          onChange={onEdit}
          onSave={onSave}
          onCancel={() => onEdit(null)}
        />
      ) : null}

      <div className="roomio-card" style={{ marginTop: 16 }}>
        <h3 className="roomio-card-title" style={{ fontSize: '0.95rem' }}>Kayıtlı şablonlar</h3>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Şablon</th>
                <th>Modül</th>
                <th>Sütunlar</th>
                <th>Güncelleme</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="roomio-page-desc">
                    Bu şube için henüz şablon yok. <strong>Yeni şablon</strong> ile başlayın.
                  </td>
                </tr>
              ) : null}
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td><strong>{tpl.name}</strong></td>
                  <td>{tpl.module}{LIVE_DATA_MODULES.has(tpl.module) ? ' · canlı' : ''}</td>
                  <td>
                    <div className="roomio-report-template-chips">
                      {tpl.columns.map((col) => (
                        <span key={col} className="roomio-badge roomio-badge--muted">
                          {fieldLabel(tpl.module, col)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{tpl.updatedAt}</td>
                  <td className="roomio-table-actions">
                    <PermissionGate permission="reports.export">
                      <Button variant="secondary" href={exportTemplateHref(tpl.id, 'pdf')}>PDF</Button>
                      {' '}
                      <Button variant="secondary" href={exportTemplateHref(tpl.id, 'csv')}>CSV</Button>
                      {' '}
                    </PermissionGate>
                    <Button variant="secondary" onClick={() => onEdit(tpl)}>{t('reports.edit')}</Button>
                    {' '}
                    <TemplateSharePanel templateId={tpl.id} templateName={tpl.name} onDone={onTplMsg} />
                    {' '}
                    <Button variant="ghost" onClick={() => onDelete(tpl.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ReportsFormsTabContent({
  formTemplates,
  formEditing,
  tplMsg,
  onStartNew,
  onEdit,
  onSave,
  onDelete,
  onTplMsg,
}: {
  formTemplates: ReportTemplate[];
  formEditing: FormTemplateDraft | null;
  tplMsg: string | null;
  onStartNew: () => void;
  onEdit: (draft: FormTemplateDraft | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onTplMsg: (msg: string) => void;
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">
            <LayoutTemplate size={18} /> Form &amp; sayfa tasarımı
          </h2>
          <Button onClick={onStartNew}>Yeni form şablonu</Button>
        </div>
        {tplMsg ? <p className="roomio-page-desc">{tplMsg}</p> : null}
        <p className="roomio-page-desc">
          Rezervasyon ve diğer formların sihirbaz adımlarını, alanlarını ve özel bilgi alanlarını buradan düzenleyin.
          Form şablonlarını diğer otellere <strong>Paylaş</strong> ile kopyalayabilirsiniz.
        </p>
        <div className="roomio-report-dept-grid" style={{ marginTop: 12 }}>
          {FORM_PAGES.map((p) => (
            <Link key={p.id} href={p.href} className="roomio-report-dept-card">
              <span aria-hidden>{p.emoji}</span>
              <strong>{p.label}</strong>
              <small>{p.href}</small>
            </Link>
          ))}
        </div>
      </div>

      {formEditing ? (
        <FormDesignEditor
          value={formEditing}
          onChange={onEdit}
          onSave={onSave}
          onCancel={() => onEdit(null)}
        />
      ) : null}

      <div className="roomio-card" style={{ marginTop: 16 }}>
        <h3 className="roomio-card-title" style={{ fontSize: '0.95rem' }}>Kayıtlı form şablonları</h3>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead>
              <tr><th>Şablon</th><th>Sayfa</th><th>Adımlar</th><th>Alan</th><th /></tr>
            </thead>
            <tbody>
              {formTemplates.length === 0 ? (
                <tr><td colSpan={5} className="roomio-page-desc">Henüz form şablonu yok.</td></tr>
              ) : null}
              {formTemplates.map((tpl) => (
                <tr key={tpl.id}>
                  <td><strong>{tpl.name}</strong></td>
                  <td>{formPageById(tpl.pageId ?? '')?.label ?? tpl.pageId}</td>
                  <td>{tpl.layout?.steps.length ?? '—'}</td>
                  <td>{tpl.columns.length}</td>
                  <td className="roomio-table-actions">
                    <Button variant="secondary" onClick={() => onEdit({
                      id: tpl.id,
                      name: tpl.name,
                      pageId: tpl.pageId ?? FORM_PAGES[0].id,
                      module: tpl.module,
                      columns: tpl.columns,
                      layout: tpl.layout ?? defaultFormLayout(tpl.pageId ?? FORM_PAGES[0].id)!,
                      updatedAt: tpl.updatedAt,
                    })}>Düzenle</Button>
                    {' '}
                    <TemplateSharePanel templateId={tpl.id} templateName={tpl.name} onDone={onTplMsg} />
                    {' '}
                    <Button variant="ghost" onClick={() => onDelete(tpl.id)}>Sil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ReportsConsolidatedTabContent({
  t,
  propertyCode,
  consolidated,
  filteredProperties,
  onRefresh,
}: {
  t: TFn;
  propertyCode?: string | null;
  consolidated: {
    properties: Array<{ propertyId: string; name: string; city: string | null; checkedIn: number; totalRooms: number; occupancyPct: number }>;
    totals: { properties: number; rooms: number; checkedIn: number };
  } | null;
  filteredProperties: Array<{ propertyId: string; name: string; city: string | null; checkedIn: number; totalRooms: number; occupancyPct: number }>;
  onRefresh: () => void;
}) {
  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 8 }}>
      <div className="roomio-card-head-row">
        <h2 className="roomio-card-title">{t('reports.consolidatedTitle')}</h2>
        <Button variant="secondary" onClick={onRefresh}>Yenile</Button>
      </div>
      <p className="roomio-page-desc">Tüm tesisler — canlı doluluk ve rezervasyon özeti.</p>
      {propertyCode ? (
        <p className="roomio-page-desc">Filtre: <strong>{propertyCode}</strong></p>
      ) : null}
      {consolidated ? (
        <>
          <table className="roomio-table">
            <thead>
              <tr>
                <th>Tesis</th>
                <th>Şehir</th>
                <th>Oda</th>
                <th>Konaklayan</th>
                <th>Doluluk</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((p) => (
                <tr key={p.propertyId}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.city ?? '—'}</td>
                  <td>{p.totalRooms}</td>
                  <td>{p.checkedIn}</td>
                  <td>%{p.occupancyPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="roomio-page-desc" style={{ marginTop: 12 }}>
            Toplam {consolidated.totals.properties} tesis · {consolidated.totals.rooms} oda · {consolidated.totals.checkedIn} konaklayan
          </p>
          <Button href="/api/reports/consolidated?format=csv">CSV indir</Button>
          {' '}
          <Button href="/api/reports/consolidated?format=pdf">{t('reports.downloadPdf')}</Button>
        </>
      ) : (
        <p className="roomio-page-desc">Yükleniyor…</p>
      )}
    </div>
  );
}
