'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { fieldLabel, LIVE_DATA_MODULES } from '@/lib/reports/field-catalog';
import { roomioFetch } from '@/lib/client/api';

type ReportTemplate = {
  id: string;
  name: string;
  module: string;
  columns: string[];
  updatedAt: string;
};

export function UserReportsPanel({ propertyId }: { propertyId: string }) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void roomioFetch('/api/reports/templates?kind=report')
      .then((r) => r.json())
      .then((j: { templates?: ReportTemplate[] }) => setTemplates(j.templates ?? []))
      .finally(() => setLoading(false));
  }, [propertyId]);

  function exportHref(templateId: string, format: 'pdf' | 'csv') {
    const params = new URLSearchParams({ templateId, format, propertyId });
    return `/api/reports/export-template?${params.toString()}`;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Kullanıcı tanımlı raporlar</h2>
          <Button href="/reports?tab=design">Yeni şablon</Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Rapor Tasarım&apos;da kaydettiğiniz şablonları buradan PDF/CSV olarak çalıştırın.
        </p>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
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
            {loading ? (
              <tr><td colSpan={5} className="roomio-table-empty">Yükleniyor…</td></tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="roomio-table-empty">
                  Henüz şablon yok. <Button variant="ghost" href="/reports?tab=design">Şablon oluştur</Button>
                </td>
              </tr>
            ) : templates.map((tpl) => (
              <tr key={tpl.id}>
                <td><strong>{tpl.name}</strong></td>
                <td>{tpl.module}{LIVE_DATA_MODULES.has(tpl.module) ? ' · canlı' : ''}</td>
                <td>
                  <div className="roomio-report-template-chips">
                    {tpl.columns.slice(0, 4).map((col) => (
                      <span key={col} className="roomio-badge roomio-badge--muted">
                        {fieldLabel(tpl.module, col)}
                      </span>
                    ))}
                    {tpl.columns.length > 4 ? <span className="roomio-badge">+{tpl.columns.length - 4}</span> : null}
                  </div>
                </td>
                <td>{tpl.updatedAt}</td>
                <td className="roomio-table-actions">
                  <PermissionGate permission="reports.export">
                    <Button variant="secondary" href={exportHref(tpl.id, 'pdf')}>PDF</Button>
                    {' '}
                    <Button variant="secondary" href={exportHref(tpl.id, 'csv')}>CSV</Button>
                    {' '}
                  </PermissionGate>
                  <Button variant="ghost" href="/reports?tab=design">Düzenle</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
