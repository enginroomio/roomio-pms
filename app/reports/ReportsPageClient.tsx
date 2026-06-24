'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FileBarChart, LayoutTemplate } from 'lucide-react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useProperty } from '@/components/property/PropertyProvider';
import type { FormTemplateDraft } from '@/components/forms/FormDesignEditor';
import { TemplateSharePanel } from '@/components/reports/TemplateSharePanel';
import { FORM_PAGES, defaultFormLayout, formPageById } from '@/lib/forms/form-catalog';
import { fieldLabel, LIVE_DATA_MODULES, REPORT_MODULES } from '@/lib/reports/field-catalog';
import { roomioFetch } from '@/lib/client/api';
import { SIDEBAR_NAV } from '@/lib/navigation/sidebar-nav';
import { CATEGORY_REPORTS, DEMO_EOD_REPORTS, type EodArchive } from '@/lib/data/eod';
import { NightAuditPanel } from '@/components/reports/NightAuditPanel';
import { NightAuditPreClosePanel } from '@/components/reports/NightAuditPreClosePanel';

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

type Tab = 'hub' | 'design' | 'user' | 'forms' | 'special' | 'remote' | 'eod' | 'consolidated';

function tabFromParams(tab: string | null, category: string | null): Tab {
  if (tab === 'design') return 'design';
  if (tab === 'user') return 'user';
  if (tab === 'forms') return 'forms';
  if (tab === 'special') return 'special';
  if (tab === 'remote') return 'remote';
  if (tab === 'eod') return 'eod';
  if (tab === 'consolidated') return 'consolidated';
  if (category) return 'hub';
  return 'hub';
}

function reportCategories() {
  const section = SIDEBAR_NAV.find((s) => s.id === 'raporlar');
  return (section?.items ?? []).filter((i) => i.href?.includes('category='));
}

export function ReportsPageClient({
  tab,
  category,
  action,
}: {
  tab: string | null;
  category: string | null;
  action: string | null;
}) {
  const { t } = useI18n();
  const { propertyId, activeProperty } = useProperty();
  const activeTab = tabFromParams(tab, category);
  const categories = reportCategories();
  const activeCategory = categories.find((c) => c.href?.includes(`category=${category}`));
  const [eodArchive, setEodArchive] = useState<EodArchive[]>([]);
  const [businessDate, setBusinessDate] = useState('2026-06-18');
  const [eodMsg, setEodMsg] = useState<string | null>(null);
  const [eodBusy, setEodBusy] = useState(false);
  const [eodCanClose, setEodCanClose] = useState(true);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [formTemplates, setFormTemplates] = useState<ReportTemplate[]>([]);
  const [formEditing, setFormEditing] = useState<FormTemplateDraft | null>(null);
  const [tplMsg, setTplMsg] = useState<string | null>(null);
  const [consolidated, setConsolidated] = useState<{
    properties: Array<{ propertyId: string; name: string; city: string | null; checkedIn: number; totalRooms: number; occupancyPct: number }>;
    totals: { properties: number; rooms: number; checkedIn: number };
  } | null>(null);

  useEffect(() => {
    void roomioFetch('/api/eod/close')
      .then((r) => r.json())
      .then((j: { archive?: EodArchive[]; businessDate?: string }) => {
        if (j.archive) setEodArchive(j.archive);
        if (j.businessDate) setBusinessDate(j.businessDate);
      });
  }, [propertyId]);

  useEffect(() => {
    if (activeTab !== 'hub' && activeTab !== 'design') return;
    void roomioFetch('/api/reports/templates?kind=report')
      .then((r) => r.json())
      .then((j: { templates?: ReportTemplate[] }) => {
        if (j.templates) setTemplates(j.templates);
      });
  }, [activeTab, propertyId]);

  useEffect(() => {
    if (activeTab !== 'forms') return;
    void roomioFetch('/api/reports/templates?kind=form')
      .then((r) => r.json())
      .then((j: { templates?: ReportTemplate[] }) => {
        if (j.templates) setFormTemplates(j.templates);
      });
  }, [activeTab, propertyId]);

  function loadConsolidated() {
    void roomioFetch('/api/reports/consolidated', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j.properties) setConsolidated({ properties: j.properties, totals: j.totals });
      });
  }

  useEffect(() => {
    if (activeTab !== 'consolidated') return;
    loadConsolidated();
  }, [activeTab, propertyId]);

  function exportHref(format: 'pdf' | 'csv', cat?: string | null): string {
    const params = new URLSearchParams({ format, propertyId });
    if (cat) params.set('category', cat);
    return `/api/reports/export?${params.toString()}`;
  }

  async function handleDeleteTemplate(id: string) {
    const r = await roomioFetch(`/api/reports/templates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (r.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (editing?.id === id) setEditing(null);
      setTplMsg('Şablon silindi.');
    }
  }

  function exportTemplateHref(templateId: string, format: 'pdf' | 'csv'): string {
    const params = new URLSearchParams({ templateId, format, propertyId });
    return `/api/reports/export-template?${params.toString()}`;
  }

  function startNewTemplate() {
    const m = REPORT_MODULES[0];
    setEditing({
      id: '',
      name: '',
      module: m.label,
      columns: [],
      updatedAt: '',
    });
  }

  async function handleSaveTemplate() {
    if (!editing) return;
    setTplMsg(null);
    const r = await roomioFetch('/api/reports/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const j = (await r.json()) as { template?: ReportTemplate; error?: string };
    if (r.ok && j.template) {
      setTemplates((prev) => {
        const idx = prev.findIndex((x) => x.id === j.template!.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = j.template!;
          return next;
        }
        return [...prev, j.template!];
      });
      setTplMsg('Şablon kaydedildi.');
      setEditing(null);
    } else {
      setTplMsg(j.error ?? 'Kayıt başarısız');
    }
  }

  async function handleCloseDay() {
    setEodBusy(true);
    setEodMsg(null);
    const r = await roomioFetch('/api/eod/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closedBy: 'Arda Yılmaz' }),
    });
    const j = (await r.json()) as { ok?: boolean; newBusinessDate?: string; error?: string; pdfBase64?: string };
    if (r.ok && j.ok) {
      setEodMsg(`Gün kapatıldı. Yeni iş günü: ${j.newBusinessDate}`);
      if (j.newBusinessDate) setBusinessDate(j.newBusinessDate);
      if (j.pdfBase64) {
        const blob = new Blob([Uint8Array.from(atob(j.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'roomio-gun-sonu.pdf';
        a.click();
      }
      const refresh = await roomioFetch('/api/eod/close');
      const data = (await refresh.json()) as { archive?: EodArchive[] };
      if (data.archive) setEodArchive(data.archive);
    } else {
      setEodMsg(j.error ?? 'Kapatma başarısız');
    }
    setEodBusy(false);
  }

  async function handleSaveFormTemplate() {
    if (!formEditing) return;
    setTplMsg(null);
    const r = await roomioFetch('/api/reports/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: formEditing.id || undefined,
        name: formEditing.name,
        module: formEditing.module,
        columns: formEditing.columns,
        kind: 'form',
        pageId: formEditing.pageId,
        layout: formEditing.layout,
      }),
    });
    const j = (await r.json()) as { template?: ReportTemplate; error?: string };
    if (j.template) {
      setFormTemplates((prev) => {
        const rest = prev.filter((x) => x.id !== j.template!.id);
        return [...rest, j.template!];
      });
      setFormEditing(null);
      setTplMsg('Form şablonu kaydedildi.');
    } else {
      setTplMsg(j.error ?? 'Kayıt başarısız');
    }
  }

  function startNewFormTemplate() {
    const p = FORM_PAGES[0];
    const layout = defaultFormLayout(p.id)!;
    setFormEditing({
      id: '',
      name: '',
      pageId: p.id,
      module: p.label,
      columns: layout.fields.map((f) => f.key),
      layout,
      updatedAt: '',
    });
  }

  async function handleDeleteFormTemplate(id: string) {
    const r = await roomioFetch(`/api/reports/templates?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (r.ok) {
      setFormTemplates((prev) => prev.filter((t) => t.id !== id));
      if (formEditing?.id === id) setFormEditing(null);
      setTplMsg('Form şablonu silindi.');
    }
  }

  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: 'hub', label: t('reports.tab.hub'), href: '/reports' },
    { id: 'design', label: t('reports.design'), href: '/reports?tab=design' },
    { id: 'forms', label: t('reports.tab.forms'), href: '/reports?tab=forms' },
    { id: 'user', label: t('reports.tab.user'), href: '/reports?tab=user' },
    { id: 'eod', label: t('reports.tab.eod'), href: '/reports?tab=eod' },
    { id: 'consolidated', label: t('reports.tab.consolidated'), href: '/reports?tab=consolidated' },
  ];

  return (
    <ModuleLayout
      breadcrumb="Sistem › Raporlar"
      title={activeTab === 'design' ? t('reports.design') : activeCategory?.label ?? t('reports.hub')}
      description="Rapor kategorileri, şablon tasarımı ve gün sonu raporları."
      sideTitle={t('nav.reports')}
      menuSearch={tab ? `?tab=${tab}` : category ? `?category=${category}` : ''}
    >
      <div className="roomio-tabs">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`roomio-tab${activeTab === item.id ? ' is-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {activeTab === 'hub' ? (
        <div className="roomio-reports-hub">
          <p className="roomio-page-desc" style={{ marginTop: 12 }}>
            Aktif şube: <strong>{activeProperty?.name ?? '—'}</strong>
            {' · '}
            İş günü: <strong>{businessDate}</strong>
            {' · '}
            <Link href="/reports?tab=design">Rapor tasarım</Link>
          </p>
          {category && activeCategory ? (
            <div className="roomio-card">
              <h2 className="roomio-card-title">{activeCategory.label}</h2>
              <p className="roomio-page-desc">
                Kategori raporları — önizleme ve dışa aktarma.
                {' '}
                <Link href="/reports">← Tüm kategoriler</Link>
              </p>
              <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
                <table className="roomio-table">
                  <thead>
                    <tr><th>Rapor</th><th>Format</th><th /></tr>
                  </thead>
                  <tbody>
                    {(CATEGORY_REPORTS[category ?? ''] ?? [
                      { id: 'default', name: `${activeCategory.label} — Özet`, format: 'PDF' },
                      { id: 'detail', name: `${activeCategory.label} — Detay`, format: 'PDF / Excel' },
                    ]).map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.format}</td>
                        <td>
                          <PermissionGate permission="reports.export">
                            <Button variant="secondary" href={exportHref('pdf', category)}>PDF</Button>
                            {' '}
                            <Button variant="secondary" href={exportHref('csv', category)}>CSV</Button>
                          </PermissionGate>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
                <div className="roomio-kpi">
                  <span className="roomio-kpi-label">Kategori</span>
                  <strong className="roomio-kpi-value">{categories.length}</strong>
                </div>
                <div className="roomio-kpi">
                  <span className="roomio-kpi-label">Şablon</span>
                  <strong className="roomio-kpi-value">{templates.length || '—'}</strong>
                </div>
                <div className="roomio-kpi">
                  <span className="roomio-kpi-label">İş günü</span>
                  <strong className="roomio-kpi-value" style={{ fontSize: '0.85rem' }}>{businessDate}</strong>
                </div>
              </div>
              <div className="roomio-reports-grid" style={{ marginTop: 16 }}>
                {categories.map((cat) => (
                  <Link key={cat.href ?? cat.label} href={cat.href ?? '/reports'} className="roomio-card roomio-reports-card">
                    <FileBarChart size={22} />
                    <strong>{cat.label}</strong>
                    <span className="roomio-page-desc">Kategori raporları</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'design' ? (
        <div style={{ marginTop: 16 }}>
          <div className="roomio-card">
            <div className="roomio-kurulus-toolbar">
              <h2 className="roomio-card-title">
                <LayoutTemplate size={18} /> {t('reports.templates')}
              </h2>
              <Button onClick={startNewTemplate}>{t('reports.newTemplate')}</Button>
            </div>
            {tplMsg ? <p className="roomio-page-desc">{tplMsg}</p> : null}
            <p className="roomio-page-desc">
              Teknik bilgi gerekmez — departman seçin, hazır şablona tıklayın veya alanları sürükleyin.
              Şablonları diğer otellere <strong>Paylaş</strong> ile kopyalayabilirsiniz.
              {' '}
              <strong>{activeProperty?.name ?? '—'}</strong>
            </p>
          </div>

          <ReportAiSuggest
            onApply={(s) => setEditing((prev) => (prev
              ? { ...prev, ...s }
              : { id: '', updatedAt: '', ...s }))}
          />

          {editing ? (
            <ReportDesignEditor
              value={editing}
              onChange={setEditing}
              onSave={() => void handleSaveTemplate()}
              onCancel={() => setEditing(null)}
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
                        <Button variant="secondary" onClick={() => setEditing(tpl)}>{t('reports.edit')}</Button>
                        {' '}
                        <TemplateSharePanel
                          templateId={tpl.id}
                          templateName={tpl.name}
                          onDone={(msg) => setTplMsg(msg)}
                        />
                        {' '}
                        <Button variant="ghost" onClick={() => void handleDeleteTemplate(tpl.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'forms' ? (
        <div style={{ marginTop: 16 }}>
          <div className="roomio-card">
            <div className="roomio-kurulus-toolbar">
              <h2 className="roomio-card-title">
                <LayoutTemplate size={18} /> Form &amp; sayfa tasarımı
              </h2>
              <Button onClick={startNewFormTemplate}>Yeni form şablonu</Button>
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
              onChange={setFormEditing}
              onSave={() => void handleSaveFormTemplate()}
              onCancel={() => setFormEditing(null)}
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
                        <Button variant="secondary" onClick={() => setFormEditing({
                          id: tpl.id,
                          name: tpl.name,
                          pageId: tpl.pageId ?? FORM_PAGES[0].id,
                          module: tpl.module,
                          columns: tpl.columns,
                          layout: tpl.layout ?? defaultFormLayout(tpl.pageId ?? FORM_PAGES[0].id)!,
                          updatedAt: tpl.updatedAt,
                        })}>Düzenle</Button>
                        {' '}
                        <TemplateSharePanel
                          templateId={tpl.id}
                          templateName={tpl.name}
                          onDone={(msg) => setTplMsg(msg)}
                        />
                        {' '}
                        <Button variant="ghost" onClick={() => void handleDeleteFormTemplate(tpl.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'user' ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Kullanıcı tanımlı raporlar</h2>
          <p className="roomio-page-desc">Henüz özel rapor tanımlanmadı. Rapor Tasarım&apos;dan şablon oluşturun.</p>
          <div className="roomio-form-actions" style={{ marginTop: 16 }}>
            <Button href="/reports?tab=design">Şablon oluştur</Button>
          </div>
        </div>
      ) : null}

      {activeTab === 'consolidated' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <div className="roomio-card-head-row">
            <h2 className="roomio-card-title">{t('reports.consolidatedTitle')}</h2>
            <Button variant="secondary" onClick={() => loadConsolidated()}>Yenile</Button>
          </div>
          <p className="roomio-page-desc">Tüm tesisler — canlı doluluk ve rezervasyon özeti.</p>
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
                  {consolidated.properties.map((p) => (
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
      ) : null}

      {activeTab === 'eod' ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">
            {action === 'close' ? 'Günü Kapat' : action === 'archive' ? 'Eski Gün Sonu Raporları' : action === 'room-prices' ? 'Oda Fiyatlarını İşle' : action === 'audit' ? 'Gece Denetim İzi' : 'Gün Sonu Raporları'}
          </h2>
          <nav className="roomio-tabs" style={{ marginTop: 12 }}>
            <Link href="/reports?tab=eod&action=fetch" className={`roomio-tab${(!action || action === 'fetch') ? ' is-active' : ''}`}>{t('reports.eod.fetch')}</Link>
            <Link href="/reports?tab=eod&action=close" className={`roomio-tab${action === 'close' ? ' is-active' : ''}`}>{t('reports.eod.close')}</Link>
            <Link href="/reports?tab=eod&action=archive" className={`roomio-tab${action === 'archive' ? ' is-active' : ''}`}>{t('reports.eod.archive')}</Link>
            <Link href="/reports?tab=eod&action=room-prices" className={`roomio-tab${action === 'room-prices' ? ' is-active' : ''}`}>{t('reports.eod.roomPrices')}</Link>
            <Link href="/reports?tab=eod&action=audit" className={`roomio-tab${action === 'audit' ? ' is-active' : ''}`}>{t('reports.eod.audit')}</Link>
          </nav>

          {action === 'audit' ? (
            <NightAuditPanel businessDate={businessDate} />
          ) : action === 'close' ? (
            <div style={{ marginTop: 16 }}>
              <NightAuditPreClosePanel businessDate={businessDate} onReadyChange={setEodCanClose} />
              <p className="roomio-page-desc">İş günü <strong>{businessDate}</strong> kapatılmaya hazır.</p>
              {eodMsg ? <p className="roomio-page-desc">{eodMsg}</p> : null}
              {!eodCanClose ? (
                <p className="roomio-page-desc roomio-text-warn">Açık kasa varken gün kapatılamaz — önce kasaları kapatın.</p>
              ) : null}
              <div className="roomio-form-actions" style={{ marginTop: 16 }}>
                <PermissionGate permission="eod.close" fallback={<p className="roomio-page-desc">Gün kapatma yetkiniz yok (RBAC).</p>}>
                  <Button disabled={eodBusy || !eodCanClose} onClick={() => void handleCloseDay()}>
                    {eodBusy ? 'Kapatılıyor…' : 'Günü kapat ve arşivle'}
                  </Button>
                </PermissionGate>
                <Button variant="secondary" href="/reports?tab=eod&action=fetch">Önce raporları al</Button>
              </div>
            </div>
          ) : action === 'archive' ? (
            <div className="roomio-table-wrap" style={{ marginTop: 16 }}>
              <table className="roomio-table">
                <thead>
                  <tr><th>İş günü</th><th>Kapanış</th><th>Kullanıcı</th><th>Doluluk</th><th>Gelir</th><th /></tr>
                </thead>
                <tbody>
                  {eodArchive.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.businessDate}</strong></td>
                      <td>{a.closedAt}</td>
                      <td>{a.closedBy}</td>
                      <td>%{a.occupancy}</td>
                      <td>₺{a.revenue.toLocaleString('tr-TR')}</td>
                      <td><Button variant="secondary">İndir</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : action === 'room-prices' ? (
            <div style={{ marginTop: 16 }}>
              <p className="roomio-page-desc">BAR ve kontrat fiyatları bir sonraki iş gününe aktarılır.</p>
              <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
                <table className="roomio-table">
                  <thead><tr><th>Oda tipi</th><th>Mevcut</th><th>Yeni</th><th>Durum</th></tr></thead>
                  <tbody>
                    <tr><td>DBL</td><td>₺5.200</td><td>₺5.400</td><td><span className="roomio-badge">Bekliyor</span></td></tr>
                    <tr><td>SUI</td><td>₺9.800</td><td>₺10.200</td><td><span className="roomio-badge">Bekliyor</span></td></tr>
                    <tr><td>TRP</td><td>₺6.100</td><td>₺6.100</td><td><span className="roomio-badge roomio-badge--muted">Değişmedi</span></td></tr>
                  </tbody>
                </table>
              </div>
              <div className="roomio-form-actions" style={{ marginTop: 16 }}>
                <Button>Fiyatları işle</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="roomio-page-desc" style={{ marginTop: 12 }}>Bugünün gün sonu rapor paketi.</p>
              <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
                <table className="roomio-table">
                  <thead><tr><th>Rapor</th><th>İş günü</th><th>Oluşturma</th><th>Durum</th><th /></tr></thead>
                  <tbody>
                    {DEMO_EOD_REPORTS.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.type}</strong></td>
                        <td>{r.businessDate}</td>
                        <td>{r.generatedAt}</td>
                        <td><span className={`roomio-badge roomio-badge--${r.status === 'ready' ? 'ok' : 'warn'}`}>{r.status === 'ready' ? 'Hazır' : 'Bekliyor'}</span></td>
                        <td><Button variant="secondary" disabled={r.status !== 'ready'}>İndir</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="roomio-form-actions" style={{ marginTop: 16 }}>
                <Button>Tüm raporları al</Button>
                <Button variant="secondary" href="/reports?tab=eod&action=close">Günü kapat</Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        <Link href="/tools/rollout?phase=sistem">Rollout test</Link>
        {' · '}
        <Link href="/settings">Kuruluş</Link>
      </p>
    </ModuleLayout>
  );
}
