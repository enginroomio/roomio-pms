import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import { guestRequestLabel } from '@/lib/housekeeping/guest-request-types';
import type { HkStaffMember } from '@/lib/housekeeping/staff';
import { maskGuestName } from '@/lib/kvkk';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import type { RoomFault } from '@/lib/server/fault-service';

export type StaffReportRow = {
  roomNo: string;
  floor: number;
  type: string;
  status: string;
  task: string;
  priority: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  requests: string;
  faults: string;
  hasRequest: boolean;
  hasFault: boolean;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function inferTask(row: HousekeepingBoardRow, roomFaults: RoomFault[]): string {
  if (row.checkOut) return 'Çıkış';
  if (row.checkIn) return 'Giriş haz.';
  if (roomFaults.some((f) => f.status !== 'resolved')) return 'Arıza';
  if (row.status === 'INSPECT') return 'Kontrol';
  if (row.status === 'OOO') return 'Arıza';
  return 'Konak.';
}

function inferPriority(row: HousekeepingBoardRow, roomFaults: RoomFault[]): string {
  if (row.checkOut || row.checkIn) return 'Acil';
  if (roomFaults.length || row.status === 'OOO' || row.status === 'INSPECT') return 'Normal';
  return 'Normal';
}

function activeFaultsForRoom(faults: RoomFault[], roomNo: string): RoomFault[] {
  return faults.filter((f) => f.roomNo === roomNo && f.status !== 'resolved');
}

function requestsForRoom(requests: HkGuestRequestRecord[], roomNo: string): string {
  const list = requests.filter((r) => r.roomNo === roomNo && r.status === 'pending');
  if (!list.length) return '—';
  return list
    .map((r) => (r.description ? `${r.requestLabel}: ${r.description}` : r.requestLabel))
    .join(' · ');
}

function faultsForRoom(faults: RoomFault[], roomNo: string): string {
  const list = activeFaultsForRoom(faults, roomNo);
  if (!list.length) return '—';
  return list
    .map((f) => (f.description ? `${f.categoryLabel}: ${f.description}` : f.categoryLabel))
    .join(' · ');
}

export function faultsForStaff(
  staff: HkStaffMember,
  boardRows: HousekeepingBoardRow[],
  faults: RoomFault[],
): RoomFault[] {
  const assignedRooms = new Set(
    boardRows.filter((r) => r.assignedTo === staff.name).map((r) => r.roomNo),
  );
  return faults
    .filter(
      (f) =>
        f.status !== 'resolved' &&
        (assignedRooms.has(f.roomNo) || staff.floors.includes(f.floor)),
    )
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo, 'tr', { numeric: true }));
}

export function staffPendingRequests(
  staff: HkStaffMember,
  boardRows: HousekeepingBoardRow[],
  guestRequests: HkGuestRequestRecord[],
): HkGuestRequestRecord[] {
  const assignedRooms = new Set(
    boardRows.filter((r) => r.assignedTo === staff.name).map((r) => r.roomNo),
  );
  return guestRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (r.assignedStaff === staff.name || assignedRooms.has(r.roomNo) || staff.floors.includes(r.floor)),
  );
}

export function buildStaffReportRows(
  staffName: string,
  boardRows: HousekeepingBoardRow[],
  guestRequests: HkGuestRequestRecord[],
  faults: RoomFault[] = [],
): StaffReportRow[] {
  return boardRows
    .filter((r) => r.assignedTo === staffName)
    .sort((a, b) => {
      const pa = a.checkOut || a.checkIn ? 0 : 1;
      const pb = b.checkOut || b.checkIn ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.roomNo.localeCompare(b.roomNo, 'tr', { numeric: true });
    })
    .map((r) => {
      const roomFaults = activeFaultsForRoom(faults, r.roomNo);
      const requestText = requestsForRoom(guestRequests, r.roomNo);
      const faultText = faultsForRoom(faults, r.roomNo);
      return {
        roomNo: r.roomNo,
        floor: r.floor,
        type: r.type,
        status: HK_STATUS_LABELS[r.status as keyof typeof HK_STATUS_LABELS] ?? r.status,
        task: inferTask(r, roomFaults),
        priority: inferPriority(r, roomFaults),
        guest: r.guestName ? maskGuestName(r.guestName) : '—',
        checkIn: formatDate(r.checkIn),
        checkOut: formatDate(r.checkOut),
        notes: r.notes ?? '—',
        requests: requestText,
        faults: faultText,
        hasRequest: requestText !== '—',
        hasFault: faultText !== '—',
      };
    });
}

export function staffReportStats(rows: StaffReportRow[]) {
  return {
    total: rows.length,
    checkout: rows.filter((r) => r.task === 'Çıkış').length,
    stay: rows.filter((r) => r.task === 'Konak.').length,
    inspect: rows.filter((r) => r.task === 'Kontrol').length,
    requests: rows.filter((r) => r.hasRequest).length,
    faults: rows.filter((r) => r.hasFault).length,
  };
}

function staffReportHtml(
  staff: HkStaffMember,
  rows: StaffReportRow[],
  boardRows: HousekeepingBoardRow[],
  guestRequests: HkGuestRequestRecord[],
  faults: RoomFault[],
  meta: { hotelName: string; businessDate: string },
) {
  const stats = staffReportStats(rows);
  const requestsList = staffPendingRequests(staff, boardRows, guestRequests);
  const faultsList = faultsForStaff(staff, boardRows, faults);

  const roomRows = rows
    .map(
      (r) => `<tr class="${r.hasFault ? 'fault' : ''}${r.hasRequest ? ' request' : ''}">
      <td>${r.priority}</td>
      <td>${r.task}</td>
      <td><strong>${r.roomNo}</strong></td>
      <td>${r.floor}</td>
      <td>${r.type}</td>
      <td>${r.status}</td>
      <td>${r.guest}</td>
      <td>${r.checkOut}</td>
      <td class="${r.hasRequest ? 'hl-request' : ''}">${r.requests}</td>
      <td class="${r.hasFault ? 'hl-fault' : ''}">${r.faults}</td>
      <td>${r.notes}</td>
    </tr>`,
    )
    .join('');

  const requestBlock =
    requestsList.length > 0
      ? `<section class="panel requests">
      <h2>Misafir talepleri (${requestsList.length})</h2>
      <ul>${requestsList
        .map(
          (req) =>
            `<li><strong>Oda ${req.roomNo}</strong> — ${guestRequestLabel(req.requestType)}${req.description ? `: ${req.description}` : ''} <em>(${req.requestedBy})</em></li>`,
        )
        .join('')}</ul>
    </section>`
      : '';

  const faultBlock =
    faultsList.length > 0
      ? `<section class="panel faults">
      <h2>Açık arızalar (${faultsList.length})</h2>
      <ul>${faultsList
        .map(
          (fault) =>
            `<li><strong>Oda ${fault.roomNo}</strong> — ${fault.categoryLabel}${fault.description ? `: ${fault.description}` : ''} <em>(${fault.assignedToName ?? 'Teknisyen atanmadı'})</em></li>`,
        )
        .join('')}</ul>
    </section>`
      : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Katçı Raporu — ${staff.name}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #101828; font-size: 10.5px; }
    header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 10px; border-bottom: 2px solid #101828; padding-bottom: 8px; }
    h1 { font-size: 14px; margin: 0 0 4px; letter-spacing: 0.04em; }
    .hotel { font-size: 12px; font-weight: 700; }
    .meta { text-align: right; color: #475467; line-height: 1.5; }
    .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .card { border: 1px solid #d0d5dd; border-radius: 6px; padding: 8px; }
    .card label { display: block; font-size: 8px; color: #667085; text-transform: uppercase; letter-spacing: 0.06em; }
    .card strong { font-size: 13px; color: #175cd3; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; margin-bottom: 10px; }
    .stat { border: 1px solid #eaecf0; border-radius: 6px; padding: 6px; text-align: center; }
    .stat b { display: block; font-size: 15px; }
    .stat span { font-size: 8px; color: #667085; }
    .stat.warn b { color: #b54708; }
    .stat.danger b { color: #b42318; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d0d5dd; padding: 4px 5px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-size: 8px; text-transform: uppercase; }
    .hl-request { color: #b54708; font-weight: 600; }
    .hl-fault { color: #b42318; font-weight: 600; }
    .extras { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .panel { border-radius: 6px; padding: 8px; }
    .panel h2 { margin: 0 0 6px; font-size: 11px; }
    .panel ul { margin: 0; padding-left: 16px; }
    .panel li { margin-bottom: 4px; }
    .requests { border: 1px solid #fec84b; background: #fffaeb; }
    .faults { border: 1px solid #fda29b; background: #fef3f2; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 14px; }
    .signatures label { font-size: 8px; color: #667085; }
    .line { border-bottom: 1px solid #101828; height: 24px; margin-top: 4px; }
    footer { margin-top: 10px; font-size: 8px; color: #98a2b3; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>GÜNLÜK KATÇI GÖREV RAPORU</h1>
      <div class="hotel">${meta.hotelName}</div>
    </div>
    <div class="meta">
      <div>Tarih: <strong>${meta.businessDate}</strong></div>
      <div>Katçı: <strong>${staff.name}</strong></div>
      <div>Ref: HK-${staff.id.toUpperCase()}</div>
      <div>Yazdırma: ${new Date().toLocaleString('tr-TR')}</div>
    </div>
  </header>

  <div class="cards">
    <div class="card">
      <label>Katçı</label>
      <strong>${staff.name}</strong>
      <div>Kat ${staff.floors.join(' · Kat ')}</div>
    </div>
    <div class="card">
      <label>HK Süpervizör</label>
      <strong>HK Şefi</strong>
      <div>Sabah vardiyası</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><b>${stats.total}</b><span>Toplam oda</span></div>
    <div class="stat"><b>${stats.checkout}</b><span>Çıkış</span></div>
    <div class="stat"><b>${stats.stay}</b><span>Konak.</span></div>
    <div class="stat"><b>${stats.inspect}</b><span>Kontrol</span></div>
    <div class="stat warn"><b>${stats.requests}</b><span>Talep</span></div>
    <div class="stat danger"><b>${stats.faults}</b><span>Arıza</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Önc.</th><th>Görev</th><th>Oda</th><th>Kat</th><th>Tip</th>
        <th>Durum</th><th>Misafir</th><th>Çıkış</th><th>Talepler</th><th>Arızalar</th><th>Not</th>
      </tr>
    </thead>
    <tbody>${roomRows}</tbody>
  </table>

  <div class="extras">${requestBlock}${faultBlock}</div>

  <div class="signatures">
    <div><label>Katçı imzası</label><div class="line"></div></div>
    <div><label>HK şefi onayı</label><div class="line"></div></div>
  </div>

  <footer>Roomio PMS · ${rows.length} oda · ${requestsList.length} talep · ${faultsList.length} arıza</footer>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export function printStaffReportA4(
  staff: HkStaffMember,
  boardRows: HousekeepingBoardRow[],
  guestRequests: HkGuestRequestRecord[],
  faults: RoomFault[] = [],
  meta?: { hotelName?: string; businessDate?: string },
) {
  const rows = buildStaffReportRows(staff.name, boardRows, guestRequests, faults);
  const html = staffReportHtml(staff, rows, boardRows, guestRequests, faults, {
    hotelName: meta?.hotelName ?? 'Roomio Otel',
    businessDate: meta?.businessDate ?? new Date().toLocaleDateString('tr-TR'),
  });
  const win = window.open('', '_blank', 'noopener,noreferrer,width=920,height=800');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export function printAllStaffReports(
  staffList: HkStaffMember[],
  boardRows: HousekeepingBoardRow[],
  guestRequests: HkGuestRequestRecord[],
  faults: RoomFault[] = [],
  meta?: { hotelName?: string; businessDate?: string },
) {
  for (const staff of staffList) {
    const hasRooms = boardRows.some((r) => r.assignedTo === staff.name);
    const hasExtras =
      faultsForStaff(staff, boardRows, faults).length > 0 ||
      staffPendingRequests(staff, boardRows, guestRequests).length > 0;
    if (hasRooms || hasExtras) printStaffReportA4(staff, boardRows, guestRequests, faults, meta);
  }
}
