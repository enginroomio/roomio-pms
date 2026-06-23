'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FileText, Plus, Printer } from 'lucide-react';
import { HkMobileFrame } from '@/components/housekeeping/HkMobileFrame';
import { HkStaffReportSheet } from '@/components/housekeeping/HkStaffReportSheet';
import { roomioFetch } from '@/lib/client/api';
import { emitHkGuestRequestUpdate } from '@/lib/client/guest-request-sync';
import {
  faultsForStaff,
  printAllStaffReports,
  printStaffReportA4,
  staffPendingRequests,
} from '@/lib/client/hk-staff-report';
import { GUEST_REQUEST_TYPES, type GuestRequestTypeId } from '@/lib/housekeeping/guest-request-types';
import { HK_STAFF } from '@/lib/housekeeping/staff';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import type { RoomFault } from '@/lib/server/fault-service';

type Tab = 'reports' | 'requests';

export function HkMobileReportsClient() {
  const [tab, setTab] = useState<Tab>('reports');
  const [boardRows, setBoardRows] = useState<HousekeepingBoardRow[]>([]);
  const [requests, setRequests] = useState<HkGuestRequestRecord[]>([]);
  const [faults, setFaults] = useState<RoomFault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState(HK_STAFF[0]?.name ?? '');
  const [roomNo, setRoomNo] = useState('');
  const [requestType, setRequestType] = useState<GuestRequestTypeId>('extra_towel');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsRes, reqRes, faultRes] = await Promise.all([
        roomioFetch('/api/housekeeping/rooms'),
        roomioFetch('/api/housekeeping/requests?status=active'),
        roomioFetch('/api/housekeeping/faults?status=active'),
      ]);
      if (!roomsRes.ok || !reqRes.ok || !faultRes.ok) throw new Error('Veriler yüklenemedi');
      const roomsData = (await roomsRes.json()) as { rooms: HousekeepingBoardRow[] };
      const reqData = (await reqRes.json()) as { requests: HkGuestRequestRecord[] };
      const faultData = (await faultRes.json()) as { faults: RoomFault[] };
      setBoardRows(roomsData.rooms);
      setRequests(reqData.requests);
      setFaults(faultData.faults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const staff = HK_STAFF.find((s) => s.name === selectedStaff) ?? HK_STAFF[0];
  const assignedCount = useMemo(
    () => boardRows.filter((r) => r.assignedTo === staff?.name).length,
    [boardRows, staff?.name],
  );
  const reqCount = useMemo(
    () => (staff ? staffPendingRequests(staff, boardRows, requests).length : 0),
    [requests, staff, boardRows],
  );
  const faultCount = useMemo(
    () => (staff ? faultsForStaff(staff, boardRows, faults).length : 0),
    [faults, staff, boardRows],
  );
  const canPrint = assignedCount > 0 || reqCount > 0 || faultCount > 0;

  const addRequest = async () => {
    if (!roomNo.trim()) return;
    setSaving(true);
    try {
      const res = await roomioFetch('/api/housekeeping/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNo: roomNo.trim(), requestType, description: description.trim() || undefined, requestedBy: 'Resepsiyon' }),
      });
      if (!res.ok) throw new Error('Kaydedilemedi');
      const data = (await res.json()) as { request: HkGuestRequestRecord };
      setRequests((p) => [data.request, ...p]);
      emitHkGuestRequestUpdate({ action: 'created', roomNo: data.request.roomNo, requestId: data.request.id });
      setRoomNo('');
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const doneRequest = async (id: string) => {
    setSaving(true);
    try {
      const res = await roomioFetch('/api/housekeeping/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'complete' }),
      });
      if (!res.ok) throw new Error('Hata');
      setRequests((p) => p.filter((r) => r.id !== id));
      emitHkGuestRequestUpdate({ action: 'completed', requestId: id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HkMobileFrame
      title="Katçı Raporları"
      actions={
        tab === 'reports' ? (
          <div className="roomio-hk-reports__print-btns">
            <button
              type="button"
              className="roomio-btn roomio-btn--primary roomio-btn--sm"
              disabled={!canPrint}
              onClick={() => staff && printStaffReportA4(staff, boardRows, requests, faults)}
            >
              <Printer size={14} /> Yazdır
            </button>
            <button
              type="button"
              className="roomio-btn roomio-btn--ghost roomio-btn--sm"
              onClick={() => printAllStaffReports(HK_STAFF, boardRows, requests, faults)}
            >
              Tümü
            </button>
          </div>
        ) : null
      }
    >
      <div className="roomio-hk-reports__tabs">
        <button type="button" className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}>
          <FileText size={14} /> Atama raporu
        </button>
        <button type="button" className={tab === 'requests' ? 'is-active' : ''} onClick={() => setTab('requests')}>
          <Plus size={14} /> Misafir talebi
        </button>
      </div>

      {error ? <p className="roomio-hk-faults__error">{error}</p> : null}

      {tab === 'requests' ? (
        <>
          <div className="roomio-card roomio-hk-reports__form">
            <p className="roomio-hk-reports__hint">Resepsiyon talepleri (havlu, yastık vb.) katçı raporunda ve yazdırmada görünür.</p>
            <label>
              Oda
              <input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="205" />
            </label>
            <label>
              Talep
              <select className="roomio-select" value={requestType} onChange={(e) => setRequestType(e.target.value as GuestRequestTypeId)}>
                {GUEST_REQUEST_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label>
              Not
              <input className="roomio-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="2 adet havlu" />
            </label>
            <button type="button" className="roomio-btn roomio-btn--primary" disabled={saving || !roomNo.trim()} onClick={() => void addRequest()}>
              Kaydet
            </button>
          </div>
          <ul className="roomio-hk-reports__req-list">
            {requests.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>Oda {r.roomNo}</strong> — {r.requestLabel}
                  {r.description ? <span> · {r.description}</span> : null}
                  <small>{r.requestedBy}{r.assignedStaff ? ` → ${r.assignedStaff}` : ''}</small>
                </div>
                <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={saving} onClick={() => void doneRequest(r.id)}>
                  <Check size={14} /> Tamam
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="roomio-hk-reports__panel">
          <div className="roomio-hk-reports__toolbar">
            <label>
              Katçı
              <select className="roomio-select" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                {HK_STAFF.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} (Kat {s.floors.join(',')})</option>
                ))}
              </select>
            </label>
            <span className="roomio-hk-reports__hint">
              {assignedCount} oda · {reqCount} talep · {faultCount} arıza
            </span>
          </div>
          {loading ? (
            <p className="roomio-hk-reports__loading">Yükleniyor…</p>
          ) : staff ? (
            <HkStaffReportSheet
              staff={staff}
              boardRows={boardRows}
              guestRequests={requests}
              faults={faults}
            />
          ) : null}
        </div>
      )}
    </HkMobileFrame>
  );
}
