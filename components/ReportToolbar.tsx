'use client';

import { Button } from '@/components/ui';

type Props = {
  onRefresh?: () => void;
  showSave?: boolean;
  refreshLabel?: string;
};

export function ReportToolbar({ onRefresh, showSave, refreshLabel = 'Raporu Getir' }: Props) {
  return (
    <div className="roomio-report-toolbar">
      {showSave ? <Button variant="secondary">Raporu Kaydet</Button> : null}
      {onRefresh ? <Button onClick={onRefresh}>{refreshLabel}</Button> : null}
      <Button variant="secondary">Excel</Button>
      <Button variant="secondary">PDF</Button>
      <Button variant="ghost">Yazdır</Button>
    </div>
  );
}

export function ReportPreviewHeader({ title, dateRange }: { title: string; dateRange: string }) {
  return (
    <div className="roomio-report-preview">
      <div className="roomio-report-preview-brand">🏨 Hotel Sapphire İstanbul</div>
      <div className="roomio-report-preview-title">{title}</div>
      <div className="roomio-report-preview-meta">{dateRange} · {new Date().toLocaleString('tr-TR')}</div>
    </div>
  );
}

export function TableFooter({ total, page = 1, pageSize = 20 }: { total: number; page?: number; pageSize?: number }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="roomio-table-footer">
      <span>Toplam Kayıt: <strong>{total}</strong></span>
      <div className="roomio-pagination">
        <button type="button" disabled>«</button>
        <button type="button" disabled>‹</button>
        <span className="roomio-pagination-active">{page}</span>
        <button type="button" disabled>›</button>
        <button type="button" disabled>»</button>
      </div>
      <span>{from} – {to} / {total} · 20 / sayfa</span>
    </div>
  );
}
