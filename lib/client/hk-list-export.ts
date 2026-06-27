import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { maskGuestName } from '@/lib/kvkk';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

export type HkListExportRow = HousekeepingBoardRow;

function formatDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function rowToCells(r: HkListExportRow): string[] {
  return [
    r.roomNo,
    String(r.floor),
    r.type,
    HK_STATUS_LABELS[r.status],
    r.assignedTo ?? '',
    r.guestName ? maskGuestName(r.guestName) : '',
    formatDate(r.checkIn),
    formatDate(r.checkOut),
    r.notes ?? '',
  ];
}

const HEADERS = ['Oda', 'Kat', 'Tip', 'HK Durumu', 'Katçı', 'Misafir', 'Giriş', 'Çıkış', 'Not'];

export function downloadHkListCsv(rows: HkListExportRow[], filename: string) {
  const lines = [
    HEADERS.join(';'),
    ...rows.map((r) => rowToCells(r).map((c) => `"${c.replace(/"/g, '""')}"`).join(';')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function reportHtml(title: string, subtitle: string, rows: HkListExportRow[]) {
  const th = HEADERS.map((h) => `<th>${h}</th>`).join('');
  const body = rows
    .map((r) => {
      const cells = rowToCells(r).map((c) => `<td>${c || '—'}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 24px; color: #101828; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #667085; font-size: 0.85rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    th, td { border: 1px solid #d0d5dd; padding: 6px 8px; text-align: left; }
    th { background: #f9fafb; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${subtitle} · ${rows.length} oda · ${new Date().toLocaleString('tr-TR')}</p>
  <table>
    <thead><tr>${th}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;
}

export function printHkListPdf(rows: HkListExportRow[], title: string, subtitle: string) {
  const html = reportHtml(title, subtitle, rows);
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export function exportHkStaffReport(
  rows: HkListExportRow[],
  staffName: string,
  format: 'csv' | 'pdf',
) {
  const staffRows = rows.filter((r) => r.assignedTo === staffName);
  const safe = staffName.replace(/\s+/g, '-').replace(/[^\w.-]/g, '');
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    downloadHkListCsv(staffRows, `hk-katci-${safe}-${date}.csv`);
    return;
  }
  printHkListPdf(staffRows, `Katçı Raporu — ${staffName}`, 'Atanan odalar');
}
