'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatMoney, type DepositRow, type FxExchange } from '@/lib/data/cash';
import { useCash } from '@/lib/client/use-cash';
import { roomioFetch } from '@/lib/client/api';

type TypeTotals = Record<string, number>;

function sumByType(entries: { type: string; amount: number }[]): TypeTotals {
  return entries.reduce<TypeTotals>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {});
}

export function DailyFinanceReportPanel() {
  const { entries, summary, registers, loading, reload } = useCash();
  const [fx, setFx] = useState<FxExchange[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);

  const loadExtras = useCallback(async () => {
    const [fxRes, depRes] = await Promise.all([
      roomioFetch('/api/fx-exchanges', { cache: 'no-store' }),
      roomioFetch('/api/deposits', { cache: 'no-store' }),
    ]);
    if (fxRes.ok) {
      const j = (await fxRes.json()) as { exchanges?: FxExchange[] };
      setFx(j.exchanges ?? []);
    }
    if (depRes.ok) {
      const j = (await depRes.json()) as { deposits?: DepositRow[] };
      setDeposits(j.deposits ?? []);
    }
  }, []);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  const byType = useMemo(() => sumByType(entries), [entries]);
  const byRegister = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries.filter((x) => x.type === 'tahsilat')) {
      map.set(e.register, (map.get(e.register) ?? 0) + e.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const fxTotal = fx.reduce((s, x) => s + x.tryAmount, 0);
  const heldDeposits = deposits.filter((d) => d.status === 'held');
  const heldTotal = heldDeposits.reduce((s, d) => s + d.amount, 0);
  const openRegisters = registers.filter((r) => r.status === 'open');

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Günlük Maliye Listesi</h2>
          <Button variant="secondary" disabled={loading} onClick={() => { void reload(); void loadExtras(); }}>
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          İş günü kasa hareketleri, döviz bozdurma ve depozit özeti.
        </p>
        <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Tahsilat</span>
            <strong className="roomio-kpi-value">{formatMoney(summary.tahsilat)}</strong>
          </div>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Ödeme</span>
            <strong className="roomio-kpi-value">{formatMoney(byType.odeme ?? 0)}</strong>
          </div>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Avans</span>
            <strong className="roomio-kpi-value">{formatMoney(byType.avans ?? 0)}</strong>
          </div>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Döviz (TRY)</span>
            <strong className="roomio-kpi-value">{formatMoney(fxTotal || (byType.doviz ?? 0))}</strong>
          </div>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Depozit (tutulan)</span>
            <strong className="roomio-kpi-value">{formatMoney(heldTotal)}</strong>
          </div>
          <div className="roomio-kpi">
            <span className="roomio-kpi-label">Açık kasa</span>
            <strong className="roomio-kpi-value">{summary.openRegisters}</strong>
          </div>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/api/cash?view=ledger&format=pdf">Kasa defteri PDF</Button>
          <Button variant="ghost" href="/reception?tab=kasa">Kasa defteri</Button>
          <Button variant="ghost" href="/reception?tab=kasa-close">Kasa kapatma</Button>
        </div>
      </div>

      <div className="roomio-detail-grid" style={{ marginTop: 12 }}>
        <div className="roomio-card roomio-table-wrap">
          <h3 className="roomio-card-title" style={{ padding: '12px 16px 0' }}>Kasa bazlı tahsilat</h3>
          <table className="roomio-table" style={{ marginTop: 8 }}>
            <thead><tr><th>Kasa</th><th>Tahsilat</th><th>Durum</th></tr></thead>
            <tbody>
              {byRegister.length === 0 ? (
                <tr><td colSpan={3} className="roomio-table-empty">Tahsilat yok.</td></tr>
              ) : byRegister.map(([reg, amt]) => {
                const st = openRegisters.find((r) => r.register === reg);
                return (
                  <tr key={reg}>
                    <td><strong>{reg}</strong></td>
                    <td>{formatMoney(amt)}</td>
                    <td>{st ? <span className="roomio-badge roomio-badge--ok">Açık</span> : <span className="roomio-badge">Kapalı</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="roomio-card roomio-table-wrap">
          <h3 className="roomio-card-title" style={{ padding: '12px 16px 0' }}>İşlem tipi özeti</h3>
          <table className="roomio-table" style={{ marginTop: 8 }}>
            <thead><tr><th>Tip</th><th>Toplam</th><th>Adet</th></tr></thead>
            <tbody>
              {Object.keys(byType).length === 0 ? (
                <tr><td colSpan={3} className="roomio-table-empty">Hareket yok.</td></tr>
              ) : Object.entries(byType).map(([type, total]) => (
                <tr key={type}>
                  <td><span className="roomio-badge">{type}</span></td>
                  <td>{formatMoney(total)}</td>
                  <td>{entries.filter((e) => e.type === type).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <h3 className="roomio-card-title" style={{ padding: '12px 16px 0' }}>Günlük hareketler</h3>
        <table className="roomio-table" style={{ marginTop: 8 }}>
          <thead>
            <tr><th>Saat</th><th>Kasa</th><th>Tip</th><th>Açıklama</th><th>Tutar</th></tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="roomio-table-empty">Kayıt yok.</td></tr>
            ) : entries.map((e) => (
              <tr key={e.id}>
                <td>{e.time}</td>
                <td>{e.register}</td>
                <td>{e.type}</td>
                <td>{e.description}</td>
                <td>{formatMoney(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="roomio-page-desc" style={{ padding: '8px 16px' }}>
          <Link href="/reception/departures?tab=fx">Döviz bozdurma</Link>
          {' · '}
          <Link href="/reception/vacant?tab=deposit">Depozit işlemleri</Link>
        </p>
      </div>
    </div>
  );
}
