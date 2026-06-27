'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button, StatusBadge } from '@/components/ui';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { CheckInIdentityPanel, type CheckInIdentityState } from '@/components/reception/CheckInIdentityPanel';
import { useReservations } from '@/lib/client/use-reservations';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { reservationToEgmSeed } from '@/lib/egm/merge';
import { RoomSuggestPanel } from '@/components/reception/RoomSuggestPanel';
import { ExtraChargesCheckInPicker } from '@/components/reception/ExtraChargesPanel';
import {
  findReservation,
  formatDate,
  formatMoney,
  getVacantRooms,
} from '@/lib/data/reception';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reservations, loading, error } = useReservations();
  const r = useMemo(() => findReservation(reservations, id), [reservations, id]);
  const vacantRooms = useMemo(() => getVacantRooms(reservations), [reservations]);
  const [roomNo, setRoomNo] = useState('');
  const [extraCharges, setExtraCharges] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [identityState, setIdentityState] = useState<CheckInIdentityState | null>(null);
  const egmSeed = useMemo(() => (r ? reservationToEgmSeed(r) : {}), [r]);
  const onIdentityChange = useCallback((state: CheckInIdentityState) => {
    setIdentityState(state);
  }, []);

  if (loading) {
    return (
      <PageHeader breadcrumb="Resepsiyon" title="Check-in">
        <ReceptionLoading loading />
      </PageHeader>
    );
  }

  if (!r) {
    return (
      <PageHeader breadcrumb="Resepsiyon" title="Rezervasyon bulunamadı">
        {error ? <ReceptionLoading error={error} /> : null}
        <Button href="/reception/arrivals">← Giriş listesi</Button>
      </PageHeader>
    );
  }

  const cleanRooms = vacantRooms.filter((room) => room.type === r.roomType && room.status === 'CLEAN');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomNo || !r) return;
    if (identityState && !identityState.canSubmit) {
      setMessages([identityState.blockReason ?? 'Kimlik onayı gerekli']);
      return;
    }
    setSubmitting(true);
    setMessages([]);

    try {
      const res = await roomioFetch('/api/reception/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: r.id,
          roomNo,
          guestName: r.guestName,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          reservationRef: r.refNo,
          extraChargeCodes: extraCharges,
          egmForm: identityState?.form,
          identityApproved: identityState?.approved ?? false,
        }),
      });
      if (!res.ok) throw new Error(await parseApiError(res, 'Check-in başarısız'));
      const j = (await res.json()) as { ok: boolean; messages?: string[]; message?: string };
      if (!j.ok) {
        setMessages(j.messages ?? (j.message ? [j.message] : ['Check-in başarısız']));
        return;
      }
      setMessages(j.messages ?? (j.message ? [j.message] : []));
      setDone(true);
      setTimeout(() => router.push('/reception/inhouse'), 1500);
    } catch (err) {
      setMessages([err instanceof Error ? err.message : 'Check-in başarısız']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageHeader
      breadcrumb={`Resepsiyon > Check-in > ${r.refNo}`}
      title="Check-in"
      description={`${r.guestName} · ${formatDate(r.checkIn)} — ${formatDate(r.checkOut)}`}
      actions={<Button variant="secondary" href="/reception/arrivals">← İptal</Button>}
    >
      {done ? (
        <div className="roomio-card roomio-alert roomio-alert--success">
          Check-in tamamlandı — Oda {roomNo}.
          {messages.length ? ` ${messages.join(' · ')}` : ''}
        </div>
      ) : null}

      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Rezervasyon</h2>
          <dl className="roomio-dl">
            <dt>Misafir</dt><dd>{r.guestName}</dd>
            <dt>Tip</dt><dd>{r.roomType}</dd>
            <dt>Pansiyon</dt><dd>{r.mealPlan}</dd>
            <dt>Fiyat</dt><dd>{formatMoney(r.rate)}/gece</dd>
            <dt>Durum</dt><dd><StatusBadge status={r.status} /></dd>
          </dl>
        </div>

        <RoomSuggestPanel
          reservationId={r.id}
          roomType={r.roomType}
          selectedRoom={roomNo}
          onSelect={setRoomNo}
        />
        <ExtraChargesCheckInPicker
          checkIn={r.checkIn}
          checkOut={r.checkOut}
          selected={extraCharges}
          onChange={setExtraCharges}
        />
        <CheckInIdentityPanel seed={egmSeed} roomNo={roomNo} onChange={onIdentityChange} />
        <form className="roomio-card roomio-form" onSubmit={(e) => void submit(e)}>
          <h2 className="roomio-card-title">Oda Ata — Otomatik Check-in</h2>
          <p className="roomio-page-desc">
            TESA kart encode, 5651 WiFi provizyonu, MikroTik hotspot ve UCM6301 santral güncellemesi otomatik yapılır.
          </p>
          <label className="roomio-field">
            <span>Uygun odalar ({r.roomType})</span>
            <select
              className="roomio-select"
              required
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
            >
              <option value="">Seçin…</option>
              {cleanRooms.map((room) => (
                <option key={room.roomNo} value={room.roomNo}>
                  Oda {room.roomNo} — Kat {room.floor}
                </option>
              ))}
            </select>
          </label>
          {messages.length && !done ? (
            <p
              className={
                messages.some((m) => /hata|başarısız|yetkiniz|Oturum/i.test(m))
                  ? 'roomio-text-warn'
                  : 'roomio-page-desc'
              }
              role="alert"
            >
              {messages.join(' · ')}
            </p>
          ) : null}
          <div className="roomio-form-actions">
            <Button variant="secondary" href="/reception/arrivals">Vazgeç</Button>
            <button
              type="submit"
              className="roomio-btn roomio-btn--primary"
              disabled={submitting || (identityState !== null && !identityState.canSubmit)}
            >
              {submitting ? 'İşleniyor…' : 'Check-in Tamamla'}
            </button>
          </div>
          <p className="roomio-page-desc" style={{ marginTop: 8 }}>
            <a href="/settings/integrations/tesa">TESA</a>
            {' · '}
            <a href="/settings/compliance/5651">5651 Hotspot</a>
            {' · '}
            <a href="/settings/integrations/pbx">Santral</a>
          </p>
        </form>
      </div>
    </PageHeader>
  );
}
