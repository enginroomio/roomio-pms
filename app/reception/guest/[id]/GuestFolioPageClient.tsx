'use client';

import { useCallback, useEffect, useState } from 'react';
import { ResepsiyonModuleLayout } from '@/components/resepsiyon/ResepsiyonModuleLayout';
import { Button, StatusBadge } from '@/components/ui';
import { FolioTabAnchor } from '@/components/reception/FolioTabAnchor';
import { GuestFolioSplitPanel } from '@/components/reception/GuestFolioSplitPanel';
import { ExtraChargesFolioPanel } from '@/components/reception/ExtraChargesPanel';
import { enrichInHouse, formatDate, formatMoney } from '@/lib/data/reception';
import type { FolioLine } from '@/lib/data/reception-queries';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { Reservation } from '@/lib/types/reservation';

type FolioSplit = {
  guestLines: FolioLine[];
  companyLines: FolioLine[];
  guestBalance: number;
  companyBalance: number;
};

export function GuestFolioPageClient({ id, tab }: { id: string; tab?: string }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [folio, setFolio] = useState<FolioSplit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, folioRes] = await Promise.all([
        roomioFetch(`/api/reservations?id=${encodeURIComponent(id)}`),
        roomioFetch(`/api/folio?reservationId=${encodeURIComponent(id)}&split=1`),
      ]);

      if (resRes.status === 404) {
        setError('Rezervasyon bulunamadı');
        setReservation(null);
        setFolio(null);
        return;
      }
      if (!resRes.ok) throw new Error(await parseApiError(resRes, 'Rezervasyon yüklenemedi'));
      if (!folioRes.ok) throw new Error(await parseApiError(folioRes, 'Folyo yüklenemedi'));

      const resJson = (await resRes.json()) as { reservation?: Reservation };
      const folioJson = (await folioRes.json()) as {
        guest?: { lines?: FolioLine[]; balance?: number };
        company?: { lines?: FolioLine[]; balance?: number };
      };

      const r = resJson.reservation;
      if (!r || r.status !== 'CHECKED_IN') {
        setError('Yalnızca konaklayan misafirlerin folyosu görüntülenebilir');
        setReservation(r ?? null);
        setFolio(null);
        return;
      }

      setReservation(r);
      setFolio({
        guestLines: folioJson.guest?.lines ?? [],
        companyLines: folioJson.company?.lines ?? [],
        guestBalance: folioJson.guest?.balance ?? 0,
        companyBalance: folioJson.company?.balance ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası');
      setReservation(null);
      setFolio(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="roomio-page-desc">Folyo yükleniyor…</p>;
  }

  if (error || !reservation || !folio) {
    return (
      <ResepsiyonModuleLayout segment="Folyo" title="Folyo görüntülenemiyor" menuSearch="">
        <p className="roomio-page-desc roomio-text-warn" role="alert">{error ?? 'Kayıt yok'}</p>
        <Button variant="secondary" href="/reception/inhouse">← Konaklayanlar</Button>
      </ResepsiyonModuleLayout>
    );
  }

  const allLines = [...folio.guestLines, ...folio.companyLines];
  const guest = enrichInHouse(reservation, allLines, folio.guestBalance + folio.companyBalance);

  return (
    <ResepsiyonModuleLayout
      segment={`Oda ${guest.roomNo} › Folyo`}
      title={guest.guestName}
      description={`Oda ${guest.roomNo} · ${guest.roomType} · Çıkış ${formatDate(guest.checkOut)}`}
      menuSearch={tab ? `?tab=${tab}` : ''}
      actions={
        <Button variant="secondary" href="/reception/inhouse">← Konaklayanlar</Button>
      }
    >
      <FolioTabAnchor tab={tab} />
      <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Toplam Folyo</div>
          <div className="roomio-kpi-value">{formatMoney(guest.folioBalance)}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Gece</div>
          <div className="roomio-kpi-value">{guest.nights}</div>
        </div>
        <div className="roomio-kpi">
          <div className="roomio-kpi-label">Durum</div>
          <div style={{ marginTop: 8 }}><StatusBadge status={guest.status} /></div>
        </div>
      </div>

      <GuestFolioSplitPanel
        reservationId={guest.id}
        guestName={guest.guestName}
        guestLines={folio.guestLines}
        companyLines={folio.companyLines}
        guestBalance={folio.guestBalance}
        companyBalance={folio.companyBalance}
        onFolioChange={() => void load()}
      />

      <ExtraChargesFolioPanel reservationId={guest.id} onApplied={() => void load()} />
    </ResepsiyonModuleLayout>
  );
}
