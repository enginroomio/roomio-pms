'use client';

import { AlertTriangle, ClipboardList, UserRound } from 'lucide-react';
import {
  buildStaffReportRows,
  faultsForStaff,
  staffPendingRequests,
  staffReportStats,
} from '@/lib/client/hk-staff-report';
import type { HkStaffMember } from '@/lib/housekeeping/staff';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import type { RoomFault } from '@/lib/server/fault-service';

type Props = {
  staff: HkStaffMember;
  boardRows: HousekeepingBoardRow[];
  guestRequests: HkGuestRequestRecord[];
  faults: RoomFault[];
  hotelName?: string;
  businessDate?: string;
};

export function HkStaffReportSheet({
  staff,
  boardRows,
  guestRequests,
  faults,
  hotelName = 'Roomio Otel',
  businessDate,
}: Props) {
  const dateLabel = businessDate ?? new Date().toLocaleDateString('tr-TR');
  const rows = buildStaffReportRows(staff.name, boardRows, guestRequests, faults);
  const stats = staffReportStats(rows);
  const pendingRequests = staffPendingRequests(staff, boardRows, guestRequests);
  const staffFaults = faultsForStaff(staff, boardRows, faults);

  return (
    <article className="roomio-hk-report-sheet" aria-label={`${staff.name} katçı raporu`}>
      <header className="roomio-hk-report-sheet__header">
        <div>
          <p className="roomio-hk-report-sheet__kicker">Günlük katçı görev raporu</p>
          <h2 className="roomio-hk-report-sheet__hotel">{hotelName}</h2>
        </div>
        <div className="roomio-hk-report-sheet__meta">
          <span>Tarih: <strong>{dateLabel}</strong></span>
          <span>Ref: HK-{staff.id.toUpperCase()}</span>
        </div>
      </header>

      <div className="roomio-hk-report-sheet__staff-card">
        <UserRound size={18} aria-hidden />
        <div>
          <strong>{staff.name}</strong>
          <span>Kat {staff.floors.join(' · Kat ')}</span>
        </div>
        <div className="roomio-hk-report-sheet__supervisor">
          <span>HK Şefi</span>
          <small>Sabah vardiyası</small>
        </div>
      </div>

      <div className="roomio-hk-report-sheet__stats">
        <div><b>{stats.total}</b><span>Toplam oda</span></div>
        <div><b>{stats.checkout}</b><span>Çıkış</span></div>
        <div><b>{stats.stay}</b><span>Konak.</span></div>
        <div><b>{stats.inspect}</b><span>Kontrol</span></div>
        <div className="is-warn"><b>{stats.requests}</b><span>Talep</span></div>
        <div className="is-danger"><b>{stats.faults}</b><span>Arıza</span></div>
      </div>

      {rows.length ? (
        <div className="roomio-hk-report-sheet__table-wrap">
          <table className="roomio-hk-report-sheet__table">
            <thead>
              <tr>
                <th>Önc.</th>
                <th>Görev</th>
                <th>Oda</th>
                <th>Kat</th>
                <th>Tip</th>
                <th>Durum</th>
                <th>Misafir</th>
                <th>Çıkış</th>
                <th>Talepler</th>
                <th>Arızalar</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.roomNo}
                  className={[
                    row.hasRequest ? 'has-request' : '',
                    row.hasFault ? 'has-fault' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td>{row.priority}</td>
                  <td>{row.task}</td>
                  <td><strong>{row.roomNo}</strong></td>
                  <td>{row.floor}</td>
                  <td>{row.type}</td>
                  <td>{row.status}</td>
                  <td>{row.guest}</td>
                  <td>{row.checkOut}</td>
                  <td>{row.requests}</td>
                  <td>{row.faults}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="roomio-hk-report-sheet__empty">Bu katçıya atanmış oda yok.</p>
      )}

      <div className="roomio-hk-report-sheet__extras">
        <section className="roomio-hk-report-sheet__panel roomio-hk-report-sheet__panel--requests">
          <h3>
            <ClipboardList size={15} aria-hidden />
            Misafir talepleri
            <span>{pendingRequests.length}</span>
          </h3>
          {pendingRequests.length ? (
            <ul>
              {pendingRequests.map((req) => (
                <li key={req.id}>
                  <strong>Oda {req.roomNo}</strong>
                  <span>{req.requestLabel}{req.description ? ` — ${req.description}` : ''}</span>
                  <small>{req.requestedBy}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="roomio-hk-report-sheet__panel-empty">Bekleyen talep yok.</p>
          )}
        </section>

        <section className="roomio-hk-report-sheet__panel roomio-hk-report-sheet__panel--faults">
          <h3>
            <AlertTriangle size={15} aria-hidden />
            Açık arızalar
            <span>{staffFaults.length}</span>
          </h3>
          {staffFaults.length ? (
            <ul>
              {staffFaults.map((fault) => (
                <li key={fault.id}>
                  <strong>Oda {fault.roomNo}</strong>
                  <span>{fault.categoryLabel}{fault.description ? ` — ${fault.description}` : ''}</span>
                  <small>
                    {fault.assignedToName ? `Teknisyen: ${fault.assignedToName}` : 'Atanmadı'}
                    {fault.reportedBy ? ` · ${fault.reportedBy}` : ''}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="roomio-hk-report-sheet__panel-empty">Açık arıza yok.</p>
          )}
        </section>
      </div>

      <footer className="roomio-hk-report-sheet__signatures">
        <div><label>Katçı imzası</label><div className="line" /></div>
        <div><label>HK şefi onayı</label><div className="line" /></div>
      </footer>
    </article>
  );
}
