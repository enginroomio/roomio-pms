'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardPlus, Plus, Send, UserCog } from 'lucide-react';
import { HkMobileFrame } from '@/components/housekeeping/HkMobileFrame';
import { roomioFetch } from '@/lib/client/api';
import { emitHkMapUpdate } from '@/lib/client/hk-map-sync';
import { emitFaultClientUpdate, useLiveFaults } from '@/lib/client/use-live-faults';
import { FAULT_QUICK_NOTES, FAULT_REPORTED_BY, type FaultReportedById } from '@/lib/housekeeping/fault-presets';
import { FAULT_CATEGORIES, HK_TECHNICIANS, type FaultCategoryId } from '@/lib/housekeeping/technicians';
import type { RoomFault } from '@/lib/server/fault-service';

type Tab = 'list' | 'new';

const STATUS: Record<string, string> = { open: 'Açık', assigned: 'Atandı', in_progress: 'İşlemde' };

export function HkMobileFaultsClient() {
  const { faults, pull, removeFault, upsertFault } = useLiveFaults();
  const [tab, setTab] = useState<Tab>('list');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomNo, setRoomNo] = useState('');
  const [category, setCategory] = useState<FaultCategoryId>('general');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState<FaultReportedById>('hk_katci');
  const [technicianId, setTechnicianId] = useState(HK_TECHNICIANS[0]?.id ?? '');

  const openCount = useMemo(() => faults.filter((f) => f.status === 'open').length, [faults]);

  const createFault = useCallback(async () => {
    if (!roomNo.trim() || !technicianId) {
      setError('Oda ve teknisyen zorunlu');
      return;
    }
    setBusy('new');
    setError(null);
    try {
      const res = await roomioFetch('/api/housekeeping/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNo: roomNo.trim(),
          category,
          description: description.trim() || undefined,
          reportedBy: FAULT_REPORTED_BY.find((r) => r.id === reportedBy)?.label,
          assignTechnicianId: technicianId,
        }),
      });
      if (!res.ok) throw new Error('Kayıt oluşturulamadı');
      const data = (await res.json()) as { fault: RoomFault };
      upsertFault(data.fault);
      emitHkMapUpdate({ roomNo: data.fault.roomNo, hkStatus: 'OOO' });
      emitFaultClientUpdate({ action: 'created', roomNo: data.fault.roomNo, faultId: data.fault.id });
      setRoomNo('');
      setDescription('');
      setTab('list');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setBusy(null);
    }
  }, [roomNo, category, description, reportedBy, technicianId, upsertFault]);

  const assign = async (faultId: string, techId: string) => {
    setBusy(faultId);
    try {
      const res = await roomioFetch('/api/housekeeping/faults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faultId, action: 'assign', technicianId: techId }),
      });
      if (!res.ok) throw new Error('Atama başarısız');
      const data = (await res.json()) as { fault: RoomFault };
      upsertFault(data.fault);
      emitFaultClientUpdate({ action: 'assigned', faultId, roomNo: data.fault.roomNo });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setBusy(null);
    }
  };

  const complete = async (fault: RoomFault) => {
    setBusy(fault.id);
    try {
      const res = await roomioFetch('/api/housekeeping/faults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faultId: fault.id, action: 'complete', resolvedBy: 'Teknik Servis' }),
      });
      if (!res.ok) throw new Error('Tamamlanamadı');
      removeFault(fault.id);
      emitHkMapUpdate({ roomNo: fault.roomNo, hkStatus: 'CLEAN' });
      emitFaultClientUpdate({ action: 'completed', faultId: fault.id, roomNo: fault.roomNo });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setBusy(null);
    }
  };

  return (
    <HkMobileFrame
      title="Arıza & Teknik Servis"
      actions={
        <button type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" onClick={() => void pull()}>
          Yenile
        </button>
      }
    >
      <div className="roomio-hk-reports__tabs">
        <button type="button" className={tab === 'list' ? 'is-active' : ''} onClick={() => setTab('list')}>
          Liste ({faults.length})
        </button>
        <button type="button" className={tab === 'new' ? 'is-active' : ''} onClick={() => setTab('new')}>
          <Plus size={14} /> Yeni arıza
        </button>
      </div>

      {error ? <p className="roomio-hk-faults__error">{error}</p> : null}

      {tab === 'new' ? (
        <div className="roomio-card roomio-hk-faults">
          <p className="roomio-hk-reports__hint">Katçı veya şef odadaki arızayı yazar, teknisyene atar.</p>
          <div className="roomio-hk-reports__form">
            <label>
              Oda
              <input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} placeholder="410" inputMode="numeric" />
            </label>
            <label>
              Bildiren
              <select className="roomio-select" value={reportedBy} onChange={(e) => setReportedBy(e.target.value as FaultReportedById)}>
                {FAULT_REPORTED_BY.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </label>
            <label>
              Kategori
              <select className="roomio-select" value={category} onChange={(e) => setCategory(e.target.value as FaultCategoryId)}>
                {FAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              Teknisyen
              <select className="roomio-select" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
                {HK_TECHNICIANS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.trade}</option>
                ))}
              </select>
            </label>
            <label>
              Açıklama
              <input className="roomio-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Klima çalışmıyor" list="fault-notes" />
              <datalist id="fault-notes">
                {FAULT_QUICK_NOTES.map((n) => <option key={n} value={n} />)}
              </datalist>
            </label>
            <button type="button" className="roomio-btn roomio-btn--primary" disabled={busy === 'new'} onClick={() => void createFault()}>
              <Send size={14} /> Kaydet ve teknisyene gönder
            </button>
          </div>
        </div>
      ) : (
        <div className="roomio-hk-faults">
          {openCount > 0 ? <p className="roomio-hk-reports__hint">{openCount} açık arıza</p> : null}
          {faults.length === 0 ? (
            <p className="roomio-hk-faults__empty">Açık arıza yok.</p>
          ) : (
            <ul className="roomio-hk-faults__list">
              {faults.map((f) => (
                <li key={f.id} className="roomio-hk-faults__item">
                  <div className="roomio-hk-faults__main">
                    <div className="roomio-hk-faults__head">
                      <strong>Oda {f.roomNo}</strong>
                      <span className="roomio-hk-faults__badge">{STATUS[f.status] ?? f.status}</span>
                    </div>
                    <span className="roomio-hk-faults__cat">{f.categoryLabel}</span>
                    {f.description ? <p className="roomio-hk-faults__desc">{f.description}</p> : null}
                    <span className="roomio-hk-faults__meta">
                      Kat {f.floor} · {f.assignedToName ?? 'Atanmadı'} · {f.reportedBy ?? 'HK'}
                    </span>
                  </div>
                  <div className="roomio-hk-faults__actions">
                    {f.status === 'open' ? HK_TECHNICIANS.map((t) => (
                      <button key={t.id} type="button" className="roomio-btn roomio-btn--ghost roomio-btn--sm" disabled={busy === f.id} onClick={() => void assign(f.id, t.id)}>
                        <UserCog size={12} /> {t.name}
                      </button>
                    )) : null}
                    <button type="button" className="roomio-btn roomio-btn--primary roomio-btn--sm" disabled={busy === f.id} onClick={() => void complete(f)}>
                      <CheckCircle2 size={12} /> Tamamlandı
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </HkMobileFrame>
  );
}
