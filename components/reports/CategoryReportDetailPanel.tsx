'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { CATEGORY_REPORTS } from '@/lib/data/eod';

export function CategoryReportDetailPanel({
  category,
  reportId,
  categoryLabel,
  exportHref,
}: {
  category: string;
  reportId: string;
  categoryLabel: string;
  exportHref: (format: 'pdf' | 'csv') => string;
}) {
  const reports = CATEGORY_REPORTS[category] ?? [];
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <div className="roomio-card" style={{ marginTop: 16, padding: 20 }}>
        <h2 className="roomio-card-title">Rapor bulunamadı</h2>
        <p className="roomio-page-desc">
          <code>{reportId}</code> bu kategoride tanımlı değil.
        </p>
        <Button variant="secondary" href={`/reports?category=${encodeURIComponent(category)}`} style={{ marginTop: 12 }}>
          Kategoriye dön
        </Button>
      </div>
    );
  }

  return (
    <div className="roomio-card" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{report.name}</h2>
        <PermissionGate permission="reports.export">
          <div className="roomio-form-actions">
            <Button variant="secondary" href={exportHref('pdf')}>PDF</Button>
            <Button variant="secondary" href={exportHref('csv')}>CSV</Button>
          </div>
        </PermissionGate>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        {categoryLabel} · Format: {report.format}
        {' · '}
        <Link href={`/reports?category=${encodeURIComponent(category)}`}>← Kategori listesi</Link>
      </p>
      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Rapor kodu</span>
          <strong className="roomio-kpi-value">{report.id}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Kategori</span>
          <strong className="roomio-kpi-value">{category}</strong>
        </div>
      </div>
    </div>
  );
}
