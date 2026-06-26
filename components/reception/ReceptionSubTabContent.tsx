'use client';

import { Button } from '@/components/ui';
import { CashLedgerPanel } from '@/components/reception/CashLedgerPanel';
import { DepositPanel } from '@/components/reception/DepositPanel';
import { useCash } from '@/lib/client/use-cash';
import { useState } from 'react';
import { RoomCollectionsPanel } from '@/components/cash/RoomCollectionsPanel';
import { BulkChargePanel } from '@/components/cash/BulkChargePanel';
import { RoomChangesPanel } from '@/components/reception/RoomChangesPanel';
import { DailyCardPanel } from '@/components/reception/DailyCardPanel';
import { roomioFetch } from '@/lib/client/api';

const TAB_META: Record<string, { title: string; description: string }> = {
  collections: { title: 'Günlük Oda Tahsilat Listesi', description: 'Konaklayan odalardan günlük tahsilat hareketleri.' },
  'cash-sale': { title: 'Peşin Satış İşlemi', description: 'Misafir dışı peşin satış — kasa defterine işlenir.' },
  prepay: { title: 'Ön Ödeme', description: 'Rezervasyon veya konaklama ön ödemesi.' },
  'room-changes': { title: 'Planlanan Oda Değişimleri', description: 'Bugün ve yarın planlanan oda taşıma listesi.' },
  'daily-card': { title: 'Günlük Kart Ver', description: 'TESA kapı kartı günlük yenileme ve kopya kart.' },
  bulk: { title: 'Toplu İşlem Girişi', description: 'Seçili konaklayanlara toplu ek ücret veya indirim.' },
  'deposit-collect': { title: 'Depozit Tahsilat', description: 'Yeni depozit alma işlemleri.' },
  'deposit-refund': { title: 'Depozit İade', description: 'Tutulan depozitlerin iadesi veya mahsubu.' },
  deposit: { title: 'Depozit İşlemleri', description: 'Depozit alma, iade ve tutulan depozit listesi.' },
};

export function receptionSubTabMeta(tab: string) {
  return TAB_META[tab] ?? { title: tab, description: '' };
}

export function ReceptionSubTabContent({ tab }: { tab: string }) {
  const { entries, reload } = useCash();
  const [saleGuest, setSaleGuest] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleMsg, setSaleMsg] = useState<string | null>(null);

  if (tab === 'collections') {
    return <RoomCollectionsPanel />;
  }

  if (tab === 'cash-sale' || tab === 'prepay') {
    async function submitCash(type: 'tahsilat' | 'avans') {
      const amount = Number(saleAmount.replace(',', '.'));
      if (!saleGuest.trim() || !Number.isFinite(amount) || amount <= 0) {
        setSaleMsg('Misafir/açıklama ve tutar gerekli');
        return;
      }
      setSaleMsg(null);
      const res = await roomioFetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_entry',
          type,
          description: tab === 'prepay' ? `Ön ödeme — ${saleGuest}` : `Peşin satış — ${saleGuest}`,
          amount,
          register: 'Ön Kasa',
        }),
      });
      if (res.ok) {
        setSaleGuest('');
        setSaleAmount('');
        setSaleMsg('Kasa defterine işlendi.');
        void reload();
      } else {
        setSaleMsg('Kayıt başarısız');
      }
    }

    return (
      <div className="roomio-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="roomio-input" placeholder={tab === 'prepay' ? 'Misafir / rez. no' : 'Açıklama'} value={saleGuest} onChange={(e) => setSaleGuest(e.target.value)} />
          <input className="roomio-input" type="number" min={0} placeholder="Tutar" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} style={{ width: 120 }} />
          <Button onClick={() => void submitCash(tab === 'prepay' ? 'avans' : 'tahsilat')}>Kaydet</Button>
        </div>
        {saleMsg ? <p className="roomio-page-desc" style={{ marginTop: 8 }}>{saleMsg}</p> : null}
        <div style={{ marginTop: 16 }}><CashLedgerPanel entries={entries} onDone={() => void reload()} /></div>
      </div>
    );
  }

  if (tab === 'deposit-collect' || tab === 'deposit-refund' || tab === 'deposit') {
    return <DepositPanel />;
  }

  if (tab === 'room-changes') {
    return <RoomChangesPanel />;
  }

  if (tab === 'daily-card') {
    return <DailyCardPanel />;
  }

  if (tab === 'bulk') {
    return <BulkChargePanel />;
  }

  return (
    <div className="roomio-card" style={{ padding: 20 }}>
      <p className="roomio-page-desc">Bu alt menü henüz yapılandırılmadı.</p>
    </div>
  );
}
