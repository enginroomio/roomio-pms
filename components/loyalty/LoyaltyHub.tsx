'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import type { LoyaltyConfig } from '@/lib/integrations/loyalty/types';
import { DEFAULT_LOYALTY_CONFIG } from '@/lib/integrations/loyalty/types';
import type {
  LoyaltyAccountRecord,
  LoyaltySummary,
  LoyaltyTransactionRecord,
} from '@/lib/loyalty/types';

type SummaryResponse = {
  ok: boolean;
  summary: LoyaltySummary;
  config: LoyaltyConfig;
};

type AccountsResponse = {
  count: number;
  accounts: LoyaltyAccountRecord[];
};

type AccountDetailResponse = {
  account: LoyaltyAccountRecord;
  transactions: LoyaltyTransactionRecord[];
};

function tierBadgeClass(tierId: string): string {
  if (tierId === 'platinum') return 'roomio-badge roomio-badge--platinum';
  if (tierId === 'gold') return 'roomio-badge roomio-badge--gold';
  if (tierId === 'silver') return 'roomio-badge roomio-badge--silver';
  return 'roomio-badge';
}

export function LoyaltyHub() {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
  const [accounts, setAccounts] = useState<LoyaltyAccountRecord[]>([]);
  const [selected, setSelected] = useState<AccountDetailResponse | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('500');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, accRes] = await Promise.all([
        roomioFetch('/api/loyalty/summary'),
        roomioFetch('/api/loyalty/accounts'),
      ]);
      if (!sumRes.ok || !accRes.ok) return;
      const sumBody = (await sumRes.json()) as SummaryResponse;
      const accBody = (await accRes.json()) as AccountsResponse;
      setSummary(sumBody.summary);
      setConfig({ ...DEFAULT_LOYALTY_CONFIG, ...sumBody.config });
      setAccounts(accBody.accounts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openAccount(email: string) {
    const res = await roomioFetch(`/api/loyalty/accounts?email=${encodeURIComponent(email)}`);
    const body = (await res.json()) as AccountDetailResponse;
    if (body.account) setSelected(body);
  }

  async function handleRedeem() {
    if (!selected?.account) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await roomioFetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selected.account.id,
          points: Number(redeemPoints),
        }),
      });
      const body = (await res.json()) as { ok: boolean; message?: string };
      if (!body.ok) {
        setMessage(body.message ?? 'Harcama başarısız');
        return;
      }
      setMessage('Puan harcandı');
      await openAccount(selected.account.email);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const filtered = query.trim()
    ? accounts.filter(
        (a) =>
          a.guestName.toLowerCase().includes(query.toLowerCase()) ||
          a.email.toLowerCase().includes(query.toLowerCase()) ||
          a.tierName.toLowerCase().includes(query.toLowerCase()),
      )
    : accounts;

  if (loading || !summary) {
    return <p className="roomio-page-desc" style={{ padding: 24 }}>Sadakat programı yükleniyor…</p>;
  }

  return (
    <>
      <div className="roomio-kpi-grid">
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Üye sayısı</span>
          <strong>{summary.accountCount}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Toplam puan</span>
          <strong>{summary.totalPoints.toLocaleString('tr-TR')}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Program</span>
          <strong>{summary.enabled ? 'Aktif' : 'Kapalı'}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Min harcama</span>
          <strong>{config.minRedeemPoints} puan</strong>
        </div>
      </div>

      <div className="roomio-two-col" style={{ marginTop: 24, gap: 24 }}>
        <section className="roomio-panel">
          <div className="roomio-panel__head">
            <h2 className="roomio-panel__title">Üye Listesi</h2>
            <input
              className="roomio-input"
              placeholder="Misafir / e-posta ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ maxWidth: 220 }}
            />
          </div>
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead>
                <tr>
                  <th>Misafir</th>
                  <th>Kademe</th>
                  <th>Puan</th>
                  <th>Gece</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => void openAccount(a.email)}
                    style={{ cursor: 'pointer' }}
                    className={selected?.account?.id === a.id ? 'roomio-table__row--active' : undefined}
                  >
                    <td>
                      <strong>{a.guestName}</strong>
                      <br />
                      <span className="roomio-muted">{a.email}</span>
                    </td>
                    <td><span className={tierBadgeClass(a.tierId)}>{a.tierName}</span></td>
                    <td>{a.points.toLocaleString('tr-TR')}</td>
                    <td>{a.lifetimeNights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="roomio-panel">
          <h2 className="roomio-panel__title">Üye Detayı</h2>
          {!selected?.account ? (
            <p className="roomio-page-desc">Detay için listeden bir üye seçin.</p>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <strong>{selected.account.guestName}</strong>
                <span className={tierBadgeClass(selected.account.tierId)} style={{ marginLeft: 8 }}>
                  {selected.account.tierName}
                </span>
                <p className="roomio-page-desc">
                  {selected.account.points.toLocaleString('tr-TR')} puan ·{' '}
                  {selected.account.lifetimeNights} gece ·{' '}
                  {Math.round(selected.account.lifetimeSpend).toLocaleString('tr-TR')}₺ harcama
                </p>
              </div>

              <div className="roomio-form-inline" style={{ marginBottom: 16 }}>
                <input
                  className="roomio-input"
                  type="number"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  style={{ width: 120 }}
                />
                <Button disabled={busy} onClick={() => void handleRedeem()}>
                  Puan Harca
                </Button>
              </div>
              {message ? <p className="roomio-page-desc">{message}</p> : null}

              <h3 className="roomio-panel__subtitle">İşlem Geçmişi</h3>
              <div className="roomio-table-wrap">
                <table className="roomio-table roomio-table--compact">
                  <thead>
                    <tr><th>Tarih</th><th>Tip</th><th>Puan</th><th>Açıklama</th></tr>
                  </thead>
                  <tbody>
                    {selected.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.createdAt.slice(0, 10)}</td>
                        <td>{tx.type}</td>
                        <td style={{ color: tx.points >= 0 ? 'var(--roomio-success)' : 'var(--roomio-danger)' }}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </td>
                        <td>{tx.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="roomio-panel" style={{ marginTop: 24 }}>
        <h2 className="roomio-panel__title">Kademe Dağılımı & Son İşlemler</h2>
        <div className="roomio-two-col" style={{ gap: 24 }}>
          <div>
            <ul className="roomio-list">
              {summary.tierBreakdown.map((t) => (
                <li key={t.tierId}>
                  <span className={tierBadgeClass(t.tierId)}>{t.tierName}</span>
                  {' '}{t.count} üye
                </li>
              ))}
            </ul>
          </div>
          <div className="roomio-table-wrap">
            <table className="roomio-table roomio-table--compact">
              <thead>
                <tr><th>Tarih</th><th>Puan</th><th>Açıklama</th></tr>
              </thead>
              <tbody>
                {summary.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.createdAt.slice(0, 10)}</td>
                    <td>{tx.points > 0 ? '+' : ''}{tx.points}</td>
                    <td>{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        Puan kuralları ve kademe tanımları için{' '}
        <Link href="/settings/integrations/loyalty">Sadakat Ayarları</Link> sayfasını kullanın.
        Çıkışta otomatik puan kazanımı aktif; online rezervasyonda kademe indirimi uygulanır.
      </p>
    </>
  );
}
