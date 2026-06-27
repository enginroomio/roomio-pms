'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardList, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { submitGuestRequest } from '@/lib/client/guest-request-submit';
import { emitHkGuestRequestUpdate } from '@/lib/client/guest-request-sync';
import { GUEST_REQUEST_TYPES, type GuestRequestTypeId } from '@/lib/housekeeping/guest-request-types';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';

export function ReceptionGuestRequestsClient() {
  const [requests, setRequests] = useState<HkGuestRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomNo, setRoomNo] = useState('');
  const [requestType, setRequestType] = useState<GuestRequestTypeId>('extra_towel');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch('/api/housekeeping/requests?status=active');
      if (!res.ok) throw new Error('Talepler yüklenemedi');
      const data = (await res.json()) as { requests: HkGuestRequestRecord[] };
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addRequest = async () => {
    if (!roomNo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await submitGuestRequest({
        roomNo: roomNo.trim(),
        requestType,
        description: description.trim() || undefined,
        requestedBy: 'Resepsiyon',
      });
      if (!result.ok || !result.request) throw new Error('Kaydedilemedi');
      setRequests((prev) => [result.request!, ...prev]);
      emitHkGuestRequestUpdate({
        action: 'created',
        roomNo: result.request.roomNo,
        requestId: result.request.id,
      });
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
      if (!res.ok) throw new Error('Tamamlanamadı');
      setRequests((prev) => prev.filter((r) => r.id !== id));
      emitHkGuestRequestUpdate({ action: 'completed', requestId: id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Misafir Talepleri"
      title="Misafir Talepleri"
      description="Havlu, yastık ve özel istekler katçı günlük raporuna otomatik düşer."
      actions={<Button variant="secondary" href="/housekeeping/reports">Katçı raporu</Button>}
    >
      <ReceptionTabs />

      {error ? <p className="roomio-text-warn" style={{ marginTop: 12 }}>{error}</p> : null}

      <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
        <div className="roomio-card">
          <h2 className="roomio-card-title">
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Yeni talep
          </h2>
          <p className="roomio-page-desc" style={{ marginBottom: 12 }}>
            Misafirin oda numarasını ve talebini girin. HK katçı raporunda ve yazdırmada görünür.
          </p>
          <div className="roomio-form-grid">
            <label className="roomio-field">
              <span>Oda no</span>
              <input
                className="roomio-input"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="205"
              />
            </label>
            <label className="roomio-field">
              <span>Talep türü</span>
              <select
                className="roomio-select"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as GuestRequestTypeId)}
              >
                {GUEST_REQUEST_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="roomio-field roomio-field--full">
              <span>Açıklama (isteğe bağlı)</span>
              <input
                className="roomio-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="2 adet banyo havlusu"
              />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button disabled={saving || !roomNo.trim()} onClick={() => void addRequest()}>
              Talebi kaydet
            </Button>
          </div>
        </div>

        <div className="roomio-card">
          <h2 className="roomio-card-title">
            <ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Bekleyen talepler
            <span className="roomio-badge" style={{ marginLeft: 8 }}>{pending.length}</span>
          </h2>
          {loading ? (
            <p className="roomio-page-desc">Yükleniyor…</p>
          ) : pending.length === 0 ? (
            <p className="roomio-page-desc">Bekleyen talep yok.</p>
          ) : (
            <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
              <table className="roomio-table">
                <thead>
                  <tr>
                    <th>Oda</th>
                    <th>Talep</th>
                    <th>Not</th>
                    <th>Katçı</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.roomNo}</strong></td>
                      <td>{r.requestLabel}</td>
                      <td>{r.description ?? '—'}</td>
                      <td>{r.assignedStaff ?? '—'}</td>
                      <td>
                        <Button
                          variant="ghost"
                          disabled={saving}
                          onClick={() => void doneRequest(r.id)}
                        >
                          <Check size={14} /> Tamam
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageHeader>
  );
}
