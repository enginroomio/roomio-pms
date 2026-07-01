'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { useReservations } from '@/lib/client/use-reservations';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { useEodFinanceSnapshot } from '@/lib/client/use-eod-finance';
import { useEodEgmRecords } from '@/lib/client/use-eod-egm';
import { useLiveHkMap } from '@/lib/client/use-live-hk-map';
import { DEFAULT_HK_ROOMS } from '@/lib/data/hk-defaults';
import type { EodArchive } from '@/lib/data/eod';
import {
  EOD_LEGACY_CATEGORIES,
  EOD_LEGACY_REPORTS,
  findLegacyReport,
  defaultReportForCategory,
  reportsForCategory,
} from '@/lib/reports/eod-legacy-catalog';
import { defaultBusinessDate, renderLegacyEodReport } from '@/lib/reports/eod-legacy-render';
import { EOD_AUDIT_REPORT_IDS, EOD_EGM_REPORT_IDS, EOD_FINANCE_REPORT_IDS, EOD_HK_REPORT_IDS } from '@/lib/reports/eod-legacy-live';
import { useEodAuditLogs } from '@/lib/client/use-eod-audit';
import { useEodGrSnapshot } from '@/lib/client/use-eod-gr-snapshot';
import { eodTemplateId, eodWizardDesignUrl } from '@/lib/reports/eod-legacy-wizard';
import { nightAuditSnapshotDisplayText } from '@/lib/reports/night-audit-text';
import { roomioFetch } from '@/lib/client/api';

type SavedReportTemplate = {
  id: string;
  name: string;
  module: string;
  columns: string[];
  updatedAt: string;
};

type Props = {
  businessDate: string;
  archive: EodArchive[];
};

function fmtInputDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function parseInputDate(value: string): string | null {
  const m = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function EodLegacyReportWorkspace({ businessDate, archive }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const { reservations } = useReservations();

  const inHouseIds = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id),
    [reservations],
  );
  const { balances: folioBalances } = useFolioBalances(inHouseIds);

  const reportParam = searchParams.get('rpr') ?? 'GR101';
  const dateParam = searchParams.get('date');

  const [categoryId, setCategoryId] = useState('gunsonu-listesi');
  const [selectedId, setSelectedId] = useState(reportParam);
  const isNightAuditView = selectedId === 'NIGHT-AUDIT';
  const [dateInput, setDateInput] = useState(fmtInputDate(dateParam ?? businessDate ?? defaultBusinessDate()));
  const [zoom, setZoom] = useState(75);
  const [pageNo, setPageNo] = useState(1);
  const [savedTemplates, setSavedTemplates] = useState<SavedReportTemplate[]>([]);

  const selectedReport = useMemo(
    () => (isNightAuditView ? null : findLegacyReport(selectedId) ?? EOD_LEGACY_REPORTS[0]!),
    [selectedId, isNightAuditView],
  );

  const savedTemplate = useMemo(() => {
    const tplId = eodTemplateId(selectedId);
    const byId = savedTemplates.find((t) => t.id === tplId);
    if (byId) return byId;
    if (!selectedReport) return undefined;
    return savedTemplates.find(
      (t) => t.module === 'Gün Sonu' && t.name === selectedReport.title,
    );
  }, [savedTemplates, selectedId, selectedReport]);

  useEffect(() => {
    void roomioFetch('/api/reports/templates?kind=report')
      .then((r) => r.json())
      .then((j: { templates?: SavedReportTemplate[] }) => {
        if (j.templates) setSavedTemplates(j.templates);
      });
  }, [selectedId]);

  const filteredReports = useMemo(() => {
    const inCategory = reportsForCategory(categoryId);
    return inCategory.length > 0 ? inCategory : EOD_LEGACY_REPORTS;
  }, [categoryId]);

  const businessIso = useMemo(() => parseInputDate(dateInput) ?? businessDate, [dateInput, businessDate]);

  const isArchivedDay = useMemo(
    () => archive.some((a) => a.businessDate === businessIso),
    [archive, businessIso],
  );

  const { text: snapshotText, found: snapshotFound } = useEodGrSnapshot(
    businessIso,
    isNightAuditView ? 'NIGHT-AUDIT' : selectedId,
    true,
  );

  const needsFinance = useMemo(() => {
    if (EOD_FINANCE_REPORT_IDS.has(selectedId)) return true;
    const cat = findLegacyReport(selectedId)?.categoryId;
    return ['kasa', 'gunluk-fatura', 'city-ledger', 'faturasiz', 'gunluk-bilanco', 'gunluk-yonetim', 'gunluk-islem', 'dept-grup', 'kumulatif-dept'].includes(
      cat ?? '',
    );
  }, [selectedId]);

  const needsHk = EOD_HK_REPORT_IDS.has(selectedId);
  const needsEgm = EOD_EGM_REPORT_IDS.has(selectedId);
  const needsAudit = EOD_AUDIT_REPORT_IDS.has(selectedId);
  const useLiveData = !snapshotFound && !isNightAuditView;
  const { hkMap } = useLiveHkMap(DEFAULT_HK_ROOMS, { pollMs: needsHk && useLiveData ? 20_000 : 0 });
  const { records: egmRecords } = useEodEgmRecords(needsEgm && useLiveData);
  const { logs: auditLogs } = useEodAuditLogs(businessIso, needsAudit && useLiveData);

  const { snapshot: financeSnapshot } = useEodFinanceSnapshot(needsFinance && useLiveData ? businessIso : '');

  const preview = useMemo(() => {
    if (isNightAuditView) {
      if (snapshotText) return nightAuditSnapshotDisplayText(snapshotText);
      return 'Gece denetim arşivi bulunamadı — gün kapatıldığında otomatik arşivlenir.';
    }
    if (snapshotText) return snapshotText;
    return renderLegacyEodReport(
      selectedReport!,
      {
        hotelName: 'HOTELSAPPHIRE',
        businessDate: businessIso,
        userName: user?.name ?? 'OGUZHAN',
        generatedAt: new Date(),
        reservations,
        folioBalances,
        finance: financeSnapshot ?? undefined,
        hkRooms: needsHk ? hkMap : undefined,
        egmRecords: needsEgm ? egmRecords : undefined,
        auditLogs: needsAudit ? auditLogs : undefined,
      },
      savedTemplate?.columns.length
        ? { columnOverride: savedTemplate.columns }
        : undefined,
    );
  }, [isNightAuditView, snapshotText, selectedReport, businessIso, user?.name, reservations, folioBalances, financeSnapshot, savedTemplate, needsHk, hkMap, needsEgm, egmRecords, needsAudit, auditLogs]);

  const syncUrl = useCallback(
    (reportId: string, date: string) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set('tab', 'eod');
      qs.set('action', 'archive');
      qs.set('rpr', reportId);
      qs.set('date', date);
      router.replace(`/reports?${qs.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (reportParam === 'NIGHT-AUDIT') {
      setSelectedId('NIGHT-AUDIT');
      return;
    }
    if (findLegacyReport(reportParam)) {
      setSelectedId(reportParam);
      const report = findLegacyReport(reportParam)!;
      setCategoryId(report.categoryId);
    }
  }, [reportParam]);

  function selectCategory(catId: string) {
    setCategoryId(catId);
    const defaultId = defaultReportForCategory(catId);
    setSelectedId(defaultId);
    syncUrl(defaultId, businessIso);
  }

  function selectReport(id: string) {
    setSelectedId(id);
    const report = findLegacyReport(id);
    if (report) setCategoryId(report.categoryId);
    syncUrl(id, businessIso);
  }

  function applyDate() {
    const parsed = parseInputDate(dateInput);
    if (parsed) syncUrl(selectedId, parsed);
  }

  function printPreview() {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(`<pre style="font:12px/1.25 Courier New,monospace;margin:16px">${preview.replace(/</g, '&lt;')}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="roomio-eod-legacy" data-testid="eod-legacy-workspace">
      <h2 className="sr-only">Eski Gün Sonu Raporları</h2>

      <div className="roomio-eod-legacy__titlebar">
        <span className="roomio-eod-legacy__titlebar-icon" aria-hidden />
        Gün Sonu Raporları — [{isNightAuditView ? 'Gece Denetim Paketi' : selectedReport?.fileName}]
      </div>

      <div className="roomio-eod-legacy__toolbar" role="toolbar" aria-label="Gün sonu rapor araç çubuğu">
        <button type="button" className="roomio-eod-legacy__tool" title="F1 Kaydet" onClick={printPreview}>
          <span className="roomio-eod-legacy__tool-icon" data-icon="save" aria-hidden />
          F1 Kaydet
        </button>
        <button type="button" className="roomio-eod-legacy__tool" title="F2 Zoom" onClick={() => setZoom((z) => Math.min(150, z + 10))}>
          <span className="roomio-eod-legacy__tool-icon" data-icon="zoom" aria-hidden />
          F2 Zoom
        </button>
        <button type="button" className="roomio-eod-legacy__tool" title="F3 Aç">
          <span className="roomio-eod-legacy__tool-icon" data-icon="open" aria-hidden />
          F3 Aç
        </button>
        <button type="button" className="roomio-eod-legacy__tool" title="F4 Pencereler">
          <span className="roomio-eod-legacy__tool-icon" data-icon="windows" aria-hidden />
          F4 Pencereler
        </button>
        <button type="button" className="roomio-eod-legacy__tool" title="F5 Metin">
          <span className="roomio-eod-legacy__tool-icon" data-icon="text" aria-hidden />
          F5 Metin
        </button>
        <button type="button" className="roomio-eod-legacy__tool" title="F7 Posta">
          <span className="roomio-eod-legacy__tool-icon" data-icon="mail" aria-hidden />
          F7 Posta
        </button>
        <Link
          href={eodWizardDesignUrl(selectedId)}
          className="roomio-eod-legacy__tool"
          title="F8 Kurulum — Rapor sihirbazında düzenle"
          data-testid="eod-f8-setup"
        >
          <span className="roomio-eod-legacy__tool-icon" data-icon="setup" aria-hidden />
          F8 Kurulum
        </Link>
        <button type="button" className="roomio-eod-legacy__tool" title="F9 Kapat" onClick={() => router.push('/reports?hub=gunsonu')}>
          <span className="roomio-eod-legacy__tool-icon" data-icon="close" aria-hidden />
          F9 Kapat
        </button>
        <label className="roomio-eod-legacy__zoom-field">
          <input
            type="number"
            min={50}
            max={150}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value) || 75)}
            aria-label="Yakınlaştırma yüzdesi"
          />
        </label>
        <label className="roomio-eod-legacy__zoom-field roomio-eod-legacy__zoom-field--page">
          <input
            type="number"
            min={1}
            max={99}
            value={pageNo}
            onChange={(e) => setPageNo(Number(e.target.value) || 1)}
            aria-label="Sayfa"
          />
        </label>
      </div>

      <div className="roomio-eod-legacy__body">
        <aside className="roomio-eod-legacy__nav" aria-label="Rapor kategorileri ve dosya listesi">
          <div className="roomio-eod-legacy__date-row">
            <input
              className="roomio-eod-legacy__date-input"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              onBlur={() => applyDate()}
              onKeyDown={(e) => e.key === 'Enter' && applyDate()}
              aria-label="İş günü"
            />
          </div>

          <div className="roomio-eod-legacy__categories">
            {EOD_LEGACY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`roomio-eod-legacy__cat${categoryId === cat.id ? ' is-active' : ''}`}
                onClick={() => selectCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <ul className="roomio-eod-legacy__tree" role="listbox" aria-label="RPR dosyaları">
            {filteredReports.map((report) => (
              <li key={report.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedId === report.id}
                  className={`roomio-eod-legacy__tree-item${selectedId === report.id ? ' is-selected' : ''}`}
                  onClick={() => selectReport(report.id)}
                >
                  {report.label}
                </button>
              </li>
            ))}
          </ul>

          {isArchivedDay ? (
            <div className="roomio-eod-legacy__archive-hint">
              <div className="roomio-eod-legacy__archive-title">Arşiv paketi</div>
              <button
                type="button"
                className={`roomio-eod-legacy__tree-item${isNightAuditView ? ' is-selected' : ''}`}
                onClick={() => {
                  setSelectedId('NIGHT-AUDIT');
                  syncUrl('NIGHT-AUDIT', businessIso);
                }}
              >
                Gece Denetim Paketi
              </button>
            </div>
          ) : null}

          {archive.length > 0 ? (
            <div className="roomio-eod-legacy__archive-hint">
              <div className="roomio-eod-legacy__archive-title">Arşiv günleri</div>
              {archive.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="roomio-eod-legacy__archive-day"
                  onClick={() => {
                    setDateInput(fmtInputDate(a.businessDate));
                    syncUrl(selectedId, a.businessDate);
                  }}
                >
                  {fmtInputDate(a.businessDate)}
                  {a.status === 'open' ? ' · günlük' : ` · %${a.occupancy}`}
                  {a.reportCount ? ` · ${a.reportCount} rapor` : ''}
                </button>
              ))}
            </div>
          ) : null}
        </aside>

        <main className="roomio-eod-legacy__preview" aria-label="Rapor önizleme">
          <pre
            className="roomio-eod-legacy__preview-text"
            style={{ fontSize: `${Math.round(zoom * 0.14)}px` }}
          >
            {preview}
          </pre>
        </main>
      </div>

      <div className="roomio-eod-legacy__statusbar">
        <span>{isNightAuditView ? 'Gece Denetim Paketi' : selectedReport?.title}</span>
        <span>İş günü: {fmtInputDate(businessIso)}</span>
        {snapshotFound ? <span>DB arşiv snapshot</span> : isArchivedDay ? <span>Canlı önizleme (DB arşiv yok)</span> : null}
        <span>Sayfa {pageNo}</span>
        <Link
          href={isNightAuditView ? `/api/eod/night-audit-package?businessDate=${encodeURIComponent(businessIso)}&format=pdf` : eodWizardDesignUrl(selectedId)}
          className="roomio-eod-legacy__status-link"
        >
          {isNightAuditView ? 'Arşiv PDF indir' : savedTemplate ? 'Sihirbaz şablonu uygulandı — düzenle' : 'Rapor sihirbazında düzenle'}
        </Link>
      </div>
    </div>
  );
}
