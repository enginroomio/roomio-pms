'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileBarChart } from 'lucide-react';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useI18n } from '@/components/i18n/I18nProvider';
import { useProperty } from '@/components/property/PropertyProvider';
import type { FormTemplateDraft } from '@/components/forms/FormDesignEditor';
import { FORM_PAGES, defaultFormLayout } from '@/lib/forms/form-catalog';
import { REPORT_MODULES } from '@/lib/reports/field-catalog';
import { roomioFetch } from '@/lib/client/api';
import { SIDEBAR_NAV } from '@/lib/navigation/sidebar-nav';
import { CATEGORY_REPORTS } from '@/lib/data/eod';
import { EodOperationsHub } from '@/components/reports/EodOperationsHub';
import {
  AgencyAnalysisPanel,
  MarketRateAnalysisPanel,
  MgmtEngReportPanel,
  NationalityReportPanel,
  RemoteReportsPanel,
  ReportCategoryHub,
  SpecialReportsPanel,
} from '@/components/reports/ReportsMiscPanels';
import { TransferReportPanel } from '@/components/reservations/TransferReportPanel';
import { ReservationDateChangeReportPanel } from '@/components/reservations/ReservationDateChangeReportPanel';
import { CategoryReportDetailPanel } from '@/components/reports/CategoryReportDetailPanel';
import { RoomChangesReportPanel } from '@/components/reception/RoomChangesPanel';
import { DailyFinanceReportPanel } from '@/components/cash/DailyFinanceReportPanel';
import { DailyBalanceReportPanel } from '@/components/cash/DailyBalanceReportPanel';
import {
  BanketOccupancyReportPanel,
  BanketRevenueReportPanel,
} from '@/components/fnb/BanketOperationsPanels';
import {
  DeptRevenueOldPanel,
  DeptTransferPanel,
  DistributionAnalysisPanel,
  KrediKontrolPanel,
  ManagementPrepareHub,
  ManagementSummaryPanel,
  MgmtOldReportPanel,
} from '@/components/reports/BackOfficeReportPanels';
import {
  EnergyConsumptionPanel,
  HkStatusReportPanel,
  RoomFixturesPanel,
} from '@/components/housekeeping/HkReportPanels';
import { UserReportsPanel } from '@/components/reports/UserReportsPanel';
import { GunSonuHubPanel, RaporlarHubPanel } from '@/components/reports/MenuHubPanels';
import {
  ReportsConsolidatedTabContent,
  ReportsDesignTabContent,
  ReportsFormsTabContent,
} from '@/components/reports/ReportsEditorTabPanels';
import { useReservations } from '@/lib/client/use-reservations';

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
  report,
  propertyCode,
}: {
  tab: string | null;
  category: string | null;
  action: string | null;
  report?: string | null;
  propertyCode?: string | null;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');
  const { propertyId, activeProperty } = useProperty();
  const { reservations, loading: rezLoading } = useReservations();
  const activeTab = tabFromParams(tab, category);
  const categories = reportCategories();
  const activeCategory = categories.find((c) => c.href?.includes(`category=${category}`));
  const [businessDate, setBusinessDate] = useState('2026-06-18');
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
      .then((j: { businessDate?: string }) => {
        if (j.businessDate) setBusinessDate(j.businessDate);
      });
  }, [propertyId]);

  useEffect(() => {
    if (activeTab !== 'hub' && activeTab !== 'design' && activeTab !== 'user') return;
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

  const consolidatedMenuSearch = propertyCode ? `?tab=consolidated&property=${propertyCode}` : '?tab=consolidated';

  if (hub === 'gunsonu' && !tab && !report && !category) {
    return (
      <ModuleLayout
        breadcrumb="Gün Sonu"
        title="Gün Sonu Merkezi"
        description="Night audit, rapor paketi ve yedekleme işlemleri."
        sideTitle={t('nav.reports')}
        menuSearch="?hub=gunsonu"
      >
        <GunSonuHubPanel />
      </ModuleLayout>
    );
  }

  if (hub === 'raporlar' && !tab && !report && !category) {
    return (
      <ModuleLayout
        breadcrumb="Raporlar"
        title="Raporlar Merkezi"
        description="Kategori raporları, tasarım ve dışa aktarma."
        sideTitle={t('nav.reports')}
        menuSearch="?hub=raporlar"
      >
        <RaporlarHubPanel />
      </ModuleLayout>
    );
  }

  if (report === 'transfer') {
    return (
      <ModuleLayout
        breadcrumb="Rezervasyon › Transfer Bilgileri"
        title="Transfer Listesi"
        description="Geliş/gidiş transfer saatleri ve uçuş bilgileri"
        sideTitle={t('nav.reports')}
        menuSearch="?report=transfer"
      >
        {rezLoading ? (
          <p className="roomio-page-desc">Yükleniyor…</p>
        ) : (
          <TransferReportPanel reservations={reservations} />
        )}
      </ModuleLayout>
    );
  }

  if (report === 'room-changes') {
    return (
      <ModuleLayout
        breadcrumb="Resepsiyon › Oda Değişimleri"
        title="Oda Değişim Listesi"
        description="Planlanan oda taşıma kayıtları"
        sideTitle={t('nav.reports')}
        menuSearch="?report=room-changes"
      >
        {rezLoading ? (
          <p className="roomio-page-desc">Yükleniyor…</p>
        ) : (
          <RoomChangesReportPanel reservations={reservations} />
        )}
      </ModuleLayout>
    );
  }

  if (report === 'departure-change') {
    return (
      <ModuleLayout
        breadcrumb="Rezervasyon › Tarih Değişimleri"
        title="Ayrılış Tarihi Değişim Tablosu"
        description="Planlanan çıkış tarihi değişen rezervasyonlar"
        sideTitle={t('nav.reports')}
        menuSearch="?report=departure-change"
      >
        <ReservationDateChangeReportPanel kind="departure" />
      </ModuleLayout>
    );
  }

  if (report === 'arrival-change') {
    return (
      <ModuleLayout
        breadcrumb="Rezervasyon › Tarih Değişimleri"
        title="Geliş Tarihi Değişim Tablosu"
        description="Planlanan giriş tarihi değişen rezervasyonlar"
        sideTitle={t('nav.reports')}
        menuSearch="?report=arrival-change"
      >
        <ReservationDateChangeReportPanel kind="arrival" />
      </ModuleLayout>
    );
  }

  if (category && report && (CATEGORY_REPORTS[category] ?? []).some((r) => r.id === report)) {
    return (
      <ModuleLayout
        breadcrumb={`Raporlar › ${activeCategory?.label ?? category}`}
        title={(CATEGORY_REPORTS[category] ?? []).find((r) => r.id === report)?.name ?? report}
        description="Kategori raporu önizleme ve dışa aktarma"
        sideTitle={t('nav.reports')}
        menuSearch={`?category=${category}&report=${report}`}
      >
        <CategoryReportDetailPanel
          category={category}
          reportId={report}
          categoryLabel={activeCategory?.label ?? category}
          exportHref={(format) => {
            const params = new URLSearchParams({ format, propertyId, category, report });
            return `/api/reports/export?${params.toString()}`;
          }}
        />
      </ModuleLayout>
    );
  }

  if (report === 'gunluk-maliye') {
    return (
      <ModuleLayout
        breadcrumb="Ön Kasa › Günlük Maliye"
        title="Günlük Maliye Listesi"
        description="Kasa hareketleri, döviz ve depozit özeti"
        sideTitle={t('nav.reports')}
        menuSearch="?report=gunluk-maliye"
      >
        <DailyFinanceReportPanel />
      </ModuleLayout>
    );
  }

  if (report === 'gunluk-balans') {
    return (
      <ModuleLayout
        breadcrumb="Ön Kasa › Günlük Balanslar"
        title="Günlük Balanslar"
        description="Konaklayan misafir folyo bakiyeleri"
        sideTitle={t('nav.reports')}
        menuSearch="?report=gunluk-balans"
      >
        <DailyBalanceReportPanel />
      </ModuleLayout>
    );
  }

  if (report === 'enerji') {
    return (
      <ModuleLayout
        breadcrumb="Kat Hizmetleri › Enerji"
        title="Enerji Tüketim Tablosu"
        description="Oda bazlı enerji tüketim özeti"
        sideTitle={t('nav.reports')}
        menuSearch="?report=enerji"
      >
        <EnergyConsumptionPanel />
      </ModuleLayout>
    );
  }

  if (report === 'demirbas') {
    return (
      <ModuleLayout
        breadcrumb="Kat Hizmetleri › Demirbaş"
        title="Oda Demirbaş Listesi"
        description="Oda envanter ve demirbaş durumu"
        sideTitle={t('nav.reports')}
        menuSearch="?report=demirbas"
      >
        <RoomFixturesPanel />
      </ModuleLayout>
    );
  }

  if (report === 'occupancy' && category === 'banket') {
    return (
      <ModuleLayout
        breadcrumb="Banket › Salon Doluluk"
        title="Salon Doluluk Raporu"
        description="Salon bazlı etkinlik ve kişi doluluğu"
        sideTitle={t('nav.reports')}
        menuSearch="?category=banket&report=occupancy"
      >
        <BanketOccupancyReportPanel />
      </ModuleLayout>
    );
  }

  if (report === 'revenue' && category === 'banket') {
    return (
      <ModuleLayout
        breadcrumb="Banket › Etkinlik Gelir"
        title="Etkinlik Gelir Raporu"
        description="Onaylı ve opsiyon banket gelirleri"
        sideTitle={t('nav.reports')}
        menuSearch="?category=banket&report=revenue"
      >
        <BanketRevenueReportPanel />
      </ModuleLayout>
    );
  }

  if (category === 'banket' && !tab && !report) {
    return (
      <ModuleLayout
        breadcrumb="Banket › Raporlar"
        title="Banket Raporları"
        description="Salon doluluk ve etkinlik gelir raporları"
        sideTitle={t('nav.reports')}
        menuSearch="?category=banket"
      >
        <div className="roomio-gr-grid">
          <Link href="/reports?category=banket&report=occupancy" className="roomio-card roomio-gr-card">
            <strong>Salon Doluluk Raporu</strong>
            <span className="roomio-page-desc">Salon bazlı etkinlik ve kişi doluluğu</span>
          </Link>
          <Link href="/reports?category=banket&report=revenue" className="roomio-card roomio-gr-card">
            <strong>Etkinlik Gelir Raporu</strong>
            <span className="roomio-page-desc">Onaylı ve opsiyon gelir özeti</span>
          </Link>
          <Link href="/fnb?tab=calendar" className="roomio-card roomio-gr-card">
            <strong>Ajanda Raporu</strong>
            <span className="roomio-page-desc">Tarih bazlı etkinlik ajandası</span>
          </Link>
          <Link href="/fnb?tab=agreements" className="roomio-card roomio-gr-card">
            <strong>Anlaşma Listesi</strong>
            <span className="roomio-page-desc">Onaylı ve opsiyon anlaşmalar</span>
          </Link>
        </div>
      </ModuleLayout>
    );
  }

  const mgmtTabs = new Set(['prepare', 'cube', 'occupancy', '3year', 'dept', 'management']);
  if (tab && mgmtTabs.has(tab)) {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Yönetim Raporu"
        title={tab === 'prepare' ? 'Yönetim Raporu Hazırlama' : 'Yönetim Raporu'}
        description="Gelir, doluluk ve departman analizleri"
        sideTitle={t('nav.reports')}
        menuSearch={`?tab=${tab}`}
      >
        {tab === 'prepare' ? <ManagementPrepareHub /> : <ManagementSummaryPanel variant={tab} />}
      </ModuleLayout>
    );
  }

  if (report === 'dept-revenue-old') {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Departman Gelirleri"
        title="Eski Tarihli Departman Gelirleri"
        description="Arşivlenmiş günlük departman gelir satırları"
        sideTitle={t('nav.reports')}
        menuSearch="?report=dept-revenue-old"
      >
        <DeptRevenueOldPanel />
      </ModuleLayout>
    );
  }

  if (report === 'distribution') {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Dağılım Analizi"
        title="Dağılım Analizi"
        description="Segment bazlı oda ve gelir dağılımı"
        sideTitle={t('nav.reports')}
        menuSearch="?report=distribution"
      >
        <DistributionAnalysisPanel />
      </ModuleLayout>
    );
  }

  if (report === 'mgmt-old') {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Yönetim Raporu"
        title="Eski Tarihli Günlük Yönetim Raporu"
        description="Gün sonu arşivinden yönetim özetleri"
        sideTitle={t('nav.reports')}
        menuSearch="?report=mgmt-old"
      >
        <MgmtOldReportPanel />
      </ModuleLayout>
    );
  }

  if (report === 'kredi-kontrol') {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Kredi Kontrol"
        title="Kredi Kontrol Listesi"
        description="Cari limit ve vadesi geçmiş bakiye takibi"
        sideTitle={t('nav.reports')}
        menuSearch="?report=kredi-kontrol"
      >
        <KrediKontrolPanel />
      </ModuleLayout>
    );
  }

  if (report === 'dept-transfer') {
    return (
      <ModuleLayout
        breadcrumb="Arka Büro › Gelir Aktarım"
        title="Departman Gelirleri Aktarım"
        description="Günlük departman gelirlerinin muhasebe aktarımı"
        sideTitle={t('nav.reports')}
        menuSearch="?report=dept-transfer"
      >
        <DeptTransferPanel />
      </ModuleLayout>
    );
  }

  if (tab === 'eod') {
    return (
      <ModuleLayout
        breadcrumb="Gün Sonu"
        title="Gün Sonu İşlemleri"
        description="Rapor alma, gün kapatma, yedekleme ve gece posting"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=eod"
      >
        <EodOperationsHub action={action} />
      </ModuleLayout>
    );
  }

  if (tab === 'special') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Özel"
        title="Özel Raporlar"
        description="Sık kullanılan özel rapor kısayolları"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=special"
      >
        <SpecialReportsPanel />
      </ModuleLayout>
    );
  }

  if (tab === 'remote') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Uzak"
        title="Uzak Otelden Raporlama"
        description="Merkez ofisten bağlı tesislere rapor çekme"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=remote"
      >
        <RemoteReportsPanel />
      </ModuleLayout>
    );
  }

  if (tab === 'daily') {
    return (
      <ModuleLayout
        breadcrumb="Sistem › Günlük Raporlar"
        title="DL — Günlük Raporlar"
        description="In-house listeleri ve günlük özet raporları"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=daily"
      >
        <ReportCategoryHub category="gunluk" label="Günlük Raporlar (InHouse Lists)" />
      </ModuleLayout>
    );
  }

  if (tab === 'user') {
    return (
      <ModuleLayout
        breadcrumb="Sistem › Kullanıcı Raporları"
        title="Kullanıcı Tanımlı Raporlar"
        description="Kayıtlı özel rapor şablonları"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=user"
      >
        <UserReportsPanel propertyId={propertyId} />
      </ModuleLayout>
    );
  }

  if (tab === 'design' && !report && !category) {
    return (
      <ModuleLayout
        breadcrumb="Sistem › Rapor Tasarım"
        title={t('reports.design')}
        description="Sürükle-bırak rapor şablon editörü"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=design"
      >
        <div className="roomio-form-actions" style={{ marginTop: 0, marginBottom: 8 }}>
          <Button variant="secondary" href="/reports">Raporlama programı</Button>
          <Button variant="ghost" href="/reports?tab=forms">Form tasarım</Button>
          <Button variant="ghost" href="/reports?tab=user">Kullanıcı raporları</Button>
        </div>
        <ReportsDesignTabContent
          t={t}
          activePropertyName={activeProperty?.name}
          templates={templates}
          editing={editing}
          tplMsg={tplMsg}
          onStartNew={startNewTemplate}
          onEdit={setEditing}
          onSave={() => void handleSaveTemplate()}
          onDelete={(id) => void handleDeleteTemplate(id)}
          onTplMsg={setTplMsg}
          exportTemplateHref={exportTemplateHref}
        />
      </ModuleLayout>
    );
  }

  if (tab === 'forms' && !report && !category) {
    return (
      <ModuleLayout
        breadcrumb="Sistem › Form Tasarım"
        title={t('reports.tab.forms')}
        description="Rezervasyon ve form sihirbazı düzeni"
        sideTitle={t('nav.reports')}
        menuSearch="?tab=forms"
      >
        <div className="roomio-form-actions" style={{ marginTop: 0, marginBottom: 8 }}>
          <Button variant="secondary" href="/reports?tab=design">Rapor tasarım</Button>
          <Button variant="ghost" href="/reservations/new">Rezervasyon formu</Button>
        </div>
        <ReportsFormsTabContent
          formTemplates={formTemplates}
          formEditing={formEditing}
          tplMsg={tplMsg}
          onStartNew={startNewFormTemplate}
          onEdit={setFormEditing}
          onSave={() => void handleSaveFormTemplate()}
          onDelete={(id) => void handleDeleteFormTemplate(id)}
          onTplMsg={setTplMsg}
        />
      </ModuleLayout>
    );
  }

  if (tab === 'consolidated' && !report && !category) {
    const filteredProperties = consolidated?.properties.filter((p) =>
      !propertyCode
      || p.propertyId === propertyCode
      || p.name.toLowerCase().includes(propertyCode.toLowerCase()),
    ) ?? [];
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Konsolide"
        title={t('reports.consolidatedTitle')}
        description="Tüm tesisler — canlı doluluk özeti"
        sideTitle={t('nav.reports')}
        menuSearch={consolidatedMenuSearch}
      >
        <ReportsConsolidatedTabContent
          t={t}
          propertyCode={propertyCode}
          consolidated={consolidated}
          filteredProperties={filteredProperties}
          onRefresh={loadConsolidated}
        />
      </ModuleLayout>
    );
  }

  if (report === 'acenta-analiz') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Acenta"
        title="Acenta Analiz"
        description="Gün, ay ve yıl bazlı acenta üretim analizi"
        sideTitle={t('nav.reports')}
        menuSearch="?report=acenta-analiz"
      >
        <AgencyAnalysisPanel />
      </ModuleLayout>
    );
  }

  if (report === 'market-rate') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Market Rate"
        title="Market Rate Analiz"
        description="Segment bazlı ADR ve gelir dağılımı"
        sideTitle={t('nav.reports')}
        menuSearch="?report=market-rate"
      >
        <MarketRateAnalysisPanel />
      </ModuleLayout>
    );
  }

  if (report === 'nationality') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Uyruk"
        title="Uyruk Raporu"
        description="Misafir uyruk dağılımı"
        sideTitle={t('nav.reports')}
        menuSearch="?report=nationality"
      >
        <NationalityReportPanel />
      </ModuleLayout>
    );
  }

  if (report === 'mgmt-eng') {
    return (
      <ModuleLayout
        breadcrumb="Raporlar › Yönetim"
        title="Management Report (Eng)"
        description="English management summary export"
        sideTitle={t('nav.reports')}
        menuSearch="?report=mgmt-eng"
      >
        <MgmtEngReportPanel />
      </ModuleLayout>
    );
  }

  if (category && !tab && !report && category !== 'banket' && category !== 'kathizmetleri' && activeCategory) {
    return (
      <ModuleLayout
        breadcrumb={`Raporlar › ${activeCategory.label}`}
        title={activeCategory.label}
        description="Kategori raporları — önizleme ve dışa aktarma"
        sideTitle={t('nav.reports')}
        menuSearch={`?category=${category}`}
      >
        <ReportCategoryHub category={category} label={activeCategory.label} />
      </ModuleLayout>
    );
  }

  if (category === 'kathizmetleri' && !tab) {
    return (
      <ModuleLayout
        breadcrumb="Kat Hizmetleri › HK Raporları"
        title="House Keeping Raporu"
        description="Canlı oda durumu ve HK raporları"
        sideTitle={t('nav.reports')}
        menuSearch="?category=kathizmetleri"
      >
        <HkStatusReportPanel />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      breadcrumb="Sistem › Raporlar"
      title={activeTab === 'design' ? t('reports.design') : activeCategory?.label ?? t('reports.hub')}
      description="Rapor kategorileri, şablon tasarımı ve gün sonu raporları."
      sideTitle={t('nav.reports')}
      menuSearch={
        tab === 'consolidated' && propertyCode
          ? consolidatedMenuSearch
          : tab
            ? `?tab=${tab}`
            : category
              ? `?category=${category}`
              : ''
      }
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
        <ReportsDesignTabContent
          t={t}
          activePropertyName={activeProperty?.name}
          templates={templates}
          editing={editing}
          tplMsg={tplMsg}
          onStartNew={startNewTemplate}
          onEdit={setEditing}
          onSave={() => void handleSaveTemplate()}
          onDelete={(id) => void handleDeleteTemplate(id)}
          onTplMsg={setTplMsg}
          exportTemplateHref={exportTemplateHref}
        />
      ) : null}

      {activeTab === 'forms' ? (
        <ReportsFormsTabContent
          formTemplates={formTemplates}
          formEditing={formEditing}
          tplMsg={tplMsg}
          onStartNew={startNewFormTemplate}
          onEdit={setFormEditing}
          onSave={() => void handleSaveFormTemplate()}
          onDelete={(id) => void handleDeleteFormTemplate(id)}
          onTplMsg={setTplMsg}
        />
      ) : null}

      {activeTab === 'consolidated' ? (
        <ReportsConsolidatedTabContent
          t={t}
          propertyCode={propertyCode}
          consolidated={consolidated}
          filteredProperties={consolidated?.properties.filter((p) =>
            !propertyCode
            || p.propertyId === propertyCode
            || p.name.toLowerCase().includes(propertyCode.toLowerCase()),
          ) ?? []}
          onRefresh={loadConsolidated}
        />
      ) : null}

      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        <Link href="/tools/rollout?phase=sistem">Rollout test</Link>
        {' · '}
        <Link href="/settings">Kuruluş</Link>
      </p>
    </ModuleLayout>
  );
}
