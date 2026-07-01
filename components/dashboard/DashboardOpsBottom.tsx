'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Sparkles, Wrench } from 'lucide-react';
import { roomioFetch } from '@/lib/client/api';
import { patchHkRoom } from '@/lib/client/hk-update';
import { HK_STATUS_LABELS } from '@/lib/data/housekeeping';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { RoomFault } from '@/lib/server/fault-service';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';
import type { RoomHkStatus } from '@/lib/types/room';

const DEMO_FAULTS: RoomFault[] = [
  {
    id: 'fault-demo-410',
    propertyId: 'demo',
    roomNo: '410',
    floor: 4,
    category: 'hvac',
    categoryLabel: 'Klima',
    description: 'Klima çalışmıyor',
    status: 'assigned',
    assignedTo: 'mehmet',
    assignedToName: 'Mehmet Y.',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'fault-demo-415',
    propertyId: 'demo',
    roomNo: '415',
    floor: 4,
    category: 'general',
    categoryLabel: 'Genel',
    description: 'Jakuzi pompası arızalı',
    status: 'assigned',
    assignedTo: 'serkan',
    assignedToName: 'Serkan D.',
    createdAt: '',
    updatedAt: '',
  },
];

const DEMO_REQUESTS: HkGuestRequestRecord[] = [
  {
    id: 'greq-demo-112',
    propertyId: 'demo',
    roomNo: '112',
    floor: 1,
    requestType: 'late_checkout',
    requestLabel: 'Geç çıkış',
    description: 'Geç çıkış talebi',
    status: 'pending',
    requestedBy: 'Resepsiyon',
    createdAt: '',
  },
  {
    id: 'greq-demo-205',
    propertyId: 'demo',
    roomNo: '205',
    floor: 2,
    requestType: 'extra_towel',
    requestLabel: 'Ek havlu',
    description: '2 adet banyo havlusu',
    status: 'pending',
    requestedBy: 'Misafir',
    assignedStaff: 'Elif K.',
    createdAt: '',
  },
];

type HkOpsItem = {
  roomNo: string;
  status: RoomHkStatus;
  label: string;
  note: string;
  assignee?: string;
};

const HK_ACTIVE: RoomHkStatus[] = ['DIRTY', 'INSPECT', 'DND'];

function buildHkItems(hkMap: Record<string, HkRoomRecord>): HkOpsItem[] {
  return Object.entries(hkMap)
    .filter(([, row]) => HK_ACTIVE.includes(row.hkStatus))
    .map(([roomNo, row]) => ({
      roomNo,
      status: row.hkStatus,
      label: HK_STATUS_LABELS[row.hkStatus as keyof typeof HK_STATUS_LABELS] ?? row.hkStatus,
      note:
        row.notes ??
        (row.hkStatus === 'DIRTY'
          ? 'Çıkış sonrası tam temizlik'
          : row.hkStatus === 'INSPECT'
            ? 'Kontrol bekliyor'
            : 'Rahatsız etmeyin'),
      assignee: row.assignedTo,
    }))
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo, 'tr'))
    .slice(0, 4);
}

function faultPriority(fault: RoomFault): string {
  if (fault.status === 'open') return 'Yeni';
  if (fault.status === 'assigned') return 'Atandı';
  return 'Devam ediyor';
}

type Props = {
  hkMap: Record<string, HkRoomRecord>;
  onHkUpdate?: (roomNo: string, status: RoomHkStatus) => void;
};

/** Ana sayfa alt şerit — HK, arıza ve misafir talepleri */
export function DashboardOpsBottom({ hkMap, onHkUpdate }: Props) {
  const hkItems = useMemo(() => buildHkItems(hkMap), [hkMap]);
  const [faults, setFaults] = useState<RoomFault[]>([]);
  const [requests, setRequests] = useState<HkGuestRequestRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadOps = useCallback(async () => {
    try {
      const [faultRes, reqRes] = await Promise.all([
        roomioFetch('/api/housekeeping/faults?status=active'),
        roomioFetch('/api/housekeeping/requests?status=active'),
      ]);
      if (faultRes.ok) {
        const j = (await faultRes.json()) as { faults?: RoomFault[] };
        setFaults(j.faults?.length ? j.faults : DEMO_FAULTS);
      } else {
        setFaults(DEMO_FAULTS);
      }
      if (reqRes.ok) {
        const j = (await reqRes.json()) as { requests?: HkGuestRequestRecord[] };
        setRequests(j.requests?.length ? j.requests : DEMO_REQUESTS);
      } else {
        setRequests(DEMO_REQUESTS);
      }
    } catch {
      setFaults(DEMO_FAULTS);
      setRequests(DEMO_REQUESTS);
    }
  }, []);

  useEffect(() => {
    void loadOps();
  }, [loadOps]);

  async function markHkClean(roomNo: string) {
    setBusy(`hk-${roomNo}`);
    try {
      onHkUpdate?.(roomNo, 'CLEAN');
      await patchHkRoom(roomNo, 'CLEAN');
      setStatus(`Oda ${roomNo} temiz olarak işaretlendi`);
    } catch {
      setStatus(`Oda ${roomNo} güncellenemedi`);
    } finally {
      setBusy(null);
    }
  }

  async function completeFault(faultId: string, roomNo: string) {
    setBusy(`fault-${faultId}`);
    try {
      const res = await roomioFetch('/api/housekeeping/faults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faultId, action: 'complete', resolvedBy: 'Dashboard' }),
      });
      if (!res.ok) throw new Error('fault');
      setFaults((prev) => prev.filter((f) => f.id !== faultId));
      setStatus(`Oda ${roomNo} arızası kapatıldı`);
    } catch {
      setStatus('Arıza kapatılamadı — yetki gerekli olabilir');
    } finally {
      setBusy(null);
    }
  }

  async function completeRequest(requestId: string, roomNo: string) {
    setBusy(`req-${requestId}`);
    try {
      const res = await roomioFetch('/api/housekeeping/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'complete' }),
      });
      if (!res.ok) throw new Error('request');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatus(`Oda ${roomNo} talebi tamamlandı`);
    } catch {
      setStatus('Talep kapatılamadı — yetki gerekli olabilir');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="roomio-dashboard-ops" aria-label="Operasyon görevleri">
      <section className="roomio-dashboard-ops__card">
        <header className="roomio-dashboard-ops__head">
          <Sparkles size={16} aria-hidden />
          <h2>Housekeeping</h2>
          <Link href="/housekeeping/rooms" className="roomio-dashboard-ops__more">
            Tümü
          </Link>
        </header>
        <ul className="roomio-dashboard-ops__list">
          {hkItems.length === 0 ? (
            <li className="roomio-dashboard-ops__empty">Aktif HK görevi yok</li>
          ) : (
            hkItems.map((item) => (
              <li key={item.roomNo} className="roomio-dashboard-ops__row">
                <div className="roomio-dashboard-ops__main">
                  <strong>
                    {item.roomNo} · {item.label}
                  </strong>
                  <span>{item.note}</span>
                  {item.assignee ? <small>{item.assignee}</small> : null}
                </div>
                <button
                  type="button"
                  className="roomio-dashboard-ops__done"
                  title="Temiz olarak işaretle"
                  disabled={busy === `hk-${item.roomNo}`}
                  onClick={() => void markHkClean(item.roomNo)}
                >
                  <Check size={14} aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="roomio-dashboard-ops__card">
        <header className="roomio-dashboard-ops__head">
          <Wrench size={16} aria-hidden />
          <h2>Arıza Kayıtları</h2>
          <Link href="/housekeeping/faults" className="roomio-dashboard-ops__more">
            Tümü
          </Link>
        </header>
        <ul className="roomio-dashboard-ops__list">
          {faults.length === 0 ? (
            <li className="roomio-dashboard-ops__empty">Açık arıza yok</li>
          ) : (
            faults.slice(0, 4).map((fault) => (
              <li key={fault.id} className="roomio-dashboard-ops__row">
                <div className="roomio-dashboard-ops__main">
                  <strong>
                    {fault.roomNo} · {fault.categoryLabel}
                  </strong>
                  <span>{fault.description ?? fault.categoryLabel}</span>
                  <small className="roomio-dashboard-ops__badge">{faultPriority(fault)}</small>
                </div>
                <button
                  type="button"
                  className="roomio-dashboard-ops__done"
                  title="Arızayı kapat"
                  disabled={busy === `fault-${fault.id}`}
                  onClick={() => void completeFault(fault.id, fault.roomNo)}
                >
                  <Check size={14} aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="roomio-dashboard-ops__card">
        <header className="roomio-dashboard-ops__head">
          <Bell size={16} aria-hidden />
          <h2>Misafir Talepleri</h2>
          <Link href="/reception/guest-requests" className="roomio-dashboard-ops__more">
            Tümü
          </Link>
        </header>
        <ul className="roomio-dashboard-ops__list">
          {requests.length === 0 ? (
            <li className="roomio-dashboard-ops__empty">Bekleyen talep yok</li>
          ) : (
            requests.slice(0, 4).map((req) => (
              <li key={req.id} className="roomio-dashboard-ops__row">
                <div className="roomio-dashboard-ops__main">
                  <strong>
                    {req.roomNo} · {req.requestLabel}
                  </strong>
                  <span>{req.description ?? req.requestLabel}</span>
                  {req.assignedStaff ? <small>{req.assignedStaff}</small> : null}
                </div>
                <button
                  type="button"
                  className="roomio-dashboard-ops__done"
                  title="Talebi tamamla"
                  disabled={busy === `req-${req.id}`}
                  onClick={() => void completeRequest(req.id, req.roomNo)}
                >
                  <Check size={14} aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      {status ? (
        <p className="roomio-dashboard-ops__status" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
