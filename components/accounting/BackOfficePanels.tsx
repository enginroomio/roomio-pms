'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/data/reservations';
import { roomioFetch } from '@/lib/client/api';
import {
  DEMO_BUDGET_LINES,
  DEMO_CREDIT_CONTROL,
  DEMO_HOTEL_BUDGET,
  type CreditControlRow,
} from '@/lib/data/back-office';
import { useCash } from '@/lib/client/use-cash';

type Invoice = {
  id: string;
  no: string;
  date: string;
  guest: string;
  amount: number;
  status: string;
  type: string;
};

type Company = {
  id: string;
  code: string;
  name: string;
  branch?: string;
  taxNo?: string;
  creditLimit?: number;
  active: boolean;
};

type LedgerEntry = {
  id: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  ref?: string;
};

const DEMO_BANK_ACCOUNTS = [
  { code: 'BNK-TRY', name: 'Ziraat TL Hesabı', iban: 'TR12 0001 0000 1234 5678 9012 34', balance: 842500 },
  { code: 'BNK-EUR', name: 'İş Bankası EUR', iban: 'TR45 0006 4000 0011 2233 4455 66', balance: 42800 },
  { code: 'BNK-USD', name: 'Garanti USD', iban: 'TR78 0006 2000 5544 3322 1100 99', balance: 18600 },
];

export function ProformaInvoicesPanel({ invoices }: { invoices: Invoice[] }) {
  const proforma = invoices.filter((i) => i.status === 'draft' || i.type === 'banket');

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Proforma Fatura Listesi</h2>
        <Link href="/accounting?tab=invoices&new=1" className="roomio-btn roomio-btn--ghost">+ Yeni proforma</Link>
      </div>
      <p className="roomio-page-desc" style={{ marginTop: 8 }}>
        Taslak ve onay bekleyen proforma faturalar.
      </p>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>No</th><th>Tarih</th><th>Cari / Misafir</th><th>Tip</th><th>Tutar</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {proforma.length === 0 ? (
            <tr><td colSpan={6} className="roomio-table-empty">Proforma kaydı yok.</td></tr>
          ) : proforma.map((inv) => (
            <tr key={inv.id}>
              <td><strong>{inv.no}</strong></td>
              <td>{inv.date}</td>
              <td>{inv.guest}</td>
              <td>{inv.type}</td>
              <td>{formatMoney(inv.amount)}</td>
              <td><span className="roomio-badge">{inv.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CariCardsPanel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coRes, ledRes] = await Promise.all([
        roomioFetch('/api/companies?all=1'),
        roomioFetch('/api/accounting/ledger'),
      ]);
      const coJ = (await coRes.json()) as { companies?: Company[] };
      const ledJ = (await ledRes.json()) as { entries?: LedgerEntry[] };
      setCompanies(coJ.companies ?? []);
      setLedger(ledJ.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of ledger) {
      const key = e.account.split('—')[0]?.trim() ?? e.account;
      map.set(key, (map.get(key) ?? 0) + e.debit - e.credit);
    }
    return map;
  }, [ledger]);

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Cari Kartlar</h2>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
      </div>
      <div className="roomio-form-actions" style={{ marginTop: 12 }}>
        <Button variant="ghost" href="/settings?section=agencies">Acenta tanımları</Button>
        <Button variant="ghost" href="/accounting?tab=ledger">Cari hareketler</Button>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Kod</th><th>Ünvan</th><th>Şube</th><th>VKN</th><th>Bakiye</th><th>Kredi limiti</th><th>Durum</th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7}>Yükleniyor…</td></tr>
          ) : companies.map((c) => {
            const bal = balances.get(c.code) ?? 0;
            return (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.name}</td>
                <td>{c.branch ?? '—'}</td>
                <td>{c.taxNo ?? '—'}</td>
                <td className={bal > 0 ? 'roomio-text-warn' : ''}>{formatMoney(bal)}</td>
                <td>{c.creditLimit ? formatMoney(c.creditLimit) : '—'}</td>
                <td><span className={`roomio-badge${c.active ? ' roomio-badge--ok' : ''}`}>{c.active ? 'Aktif' : 'Pasif'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CariPaymentsPanel() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void roomioFetch('/api/accounting/ledger')
      .then((r) => r.json())
      .then((j: { entries?: LedgerEntry[] }) => setLedger(j.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  const payments = ledger.filter((e) => e.credit > 0);

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Cari Ödemeler</h2>
        <Button variant="ghost" href="/accounting?tab=ledger">Yeni ödeme</Button>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Tarih</th><th>Cari</th><th>Açıklama</th><th>Ödeme tutarı</th><th>Ref</th></tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5}>Yükleniyor…</td></tr>
          ) : payments.length === 0 ? (
            <tr><td colSpan={5} className="roomio-table-empty">Ödeme kaydı yok.</td></tr>
          ) : payments.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td><strong>{e.account}</strong></td>
              <td>{e.description}</td>
              <td>{formatMoney(e.credit)}</td>
              <td>{e.ref ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BankCardsPanel() {
  const { registers, loading, reload } = useCash();

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Kasa — Banka Kartları</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void reload()}>Yenile</Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Açık kasalar ve banka hesap kartları.</p>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <h3 className="roomio-card-title">Kasa kartları</h3>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Kasa</th><th>Açılış</th><th>Durum</th><th>Açılış bakiyesi</th><th>Kapanış</th></tr>
          </thead>
          <tbody>
            {registers.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.register}</strong></td>
                <td>{r.openedAt}</td>
                <td><span className={`roomio-badge${r.status === 'open' ? ' roomio-badge--ok' : ''}`}>{r.status}</span></td>
                <td>{formatMoney(r.openingBalance)}</td>
                <td>{r.closingBalance != null ? formatMoney(r.closingBalance) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <h3 className="roomio-card-title">Banka hesapları</h3>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Kod</th><th>Hesap</th><th>IBAN</th><th>Bakiye</th></tr>
          </thead>
          <tbody>
            {DEMO_BANK_ACCOUNTS.map((b) => (
              <tr key={b.code}>
                <td><strong>{b.code}</strong></td>
                <td>{b.name}</td>
                <td>{b.iban}</td>
                <td>{formatMoney(b.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type BudgetView = 'budget' | 'budget-values' | 'budget-hotel' | 'budget-dept';

export function BudgetPanel({ view }: { view: BudgetView }) {
  const title =
    view === 'budget-hotel' ? 'Otel Bütçe Değer'
      : view === 'budget-dept' ? 'Departman Bütçe'
        : view === 'budget-values' ? 'Bütçe Değerleri'
          : 'Bütçe Girişleri';

  if (view === 'budget-hotel') {
    const b = DEMO_HOTEL_BUDGET;
    const total = b.rooms + b.fb + b.spa + b.banket + b.other;
    return (
      <div className="roomio-card" style={{ marginTop: 16, padding: 20 }}>
        <h2 className="roomio-card-title">{title}</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>{b.year} yıllık otel bütçe hedefleri.</p>
        <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Oda</span><strong className="roomio-kpi-value">{formatMoney(b.rooms)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">F&B</span><strong className="roomio-kpi-value">{formatMoney(b.fb)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Spa</span><strong className="roomio-kpi-value">{formatMoney(b.spa)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Banket</span><strong className="roomio-kpi-value">{formatMoney(b.banket)}</strong></div>
          <div className="roomio-kpi"><span className="roomio-kpi-label">Toplam</span><strong className="roomio-kpi-value">{formatMoney(total)}</strong></div>
        </div>
      </div>
    );
  }

  const lines = view === 'budget-dept'
    ? DEMO_BUDGET_LINES
    : DEMO_BUDGET_LINES;

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">{title}</h2>
        <div className="roomio-form-actions">
          <Button variant="ghost" href="/accounting?tab=budget-hotel">Otel bütçe</Button>
          <Button variant="ghost" href="/accounting?tab=budget-dept">Departman bütçe</Button>
        </div>
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Departman</th><th>Dönem</th><th>Bütçe</th><th>Gerçekleşen</th><th>Fark</th><th>%</th></tr>
        </thead>
        <tbody>
          {lines.map((row) => {
            const diff = row.actual - row.budget;
            const pct = row.budget > 0 ? Math.round((row.actual / row.budget) * 100) : 0;
            return (
              <tr key={row.id}>
                <td><strong>{row.department}</strong></td>
                <td>{row.month}</td>
                <td>{formatMoney(row.budget)}</td>
                <td>{formatMoney(row.actual)}</td>
                <td className={diff < 0 ? 'roomio-text-warn' : 'roomio-text-ok'}>{formatMoney(diff)}</td>
                <td>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function KrediKontrolPanel({ rows = DEMO_CREDIT_CONTROL }: { rows?: CreditControlRow[] }) {
  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Kredi Kontrol Listesi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>Cari limit ve vadesi geçmiş bakiye takibi.</p>
      </div>
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr><th>Kod</th><th>Cari</th><th>Limit</th><th>Bakiye</th><th>Gecikme (gün)</th><th>Durum</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td><strong>{r.code}</strong></td>
                <td>{r.name}</td>
                <td>{formatMoney(r.limit)}</td>
                <td>{formatMoney(r.balance)}</td>
                <td>{r.overdueDays}</td>
                <td>
                  <span className={`roomio-badge${r.status === 'ok' ? ' roomio-badge--ok' : r.status === 'block' ? ' roomio-badge--danger' : ''}`}>
                    {r.status === 'ok' ? 'Uygun' : r.status === 'warn' ? 'Uyarı' : 'Blok'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  minQty: number;
  unitCost: number;
};

export function ProductCardsPanel() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/inventory/stock');
      const j = (await res.json()) as { items?: StockItem[] };
      setStock(j.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function adjust(id: string, type: 'in' | 'out') {
    setMsg(null);
    await roomioFetch('/api/inventory/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId: id, type, qty: 1 }),
    });
    setMsg(type === 'in' ? 'Stok girişi kaydedildi.' : 'Stok çıkışı kaydedildi.');
    await load();
  }

  const lowStock = stock.filter((s) => s.qty <= s.minQty);

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Ürün kartları (stok)</h2>
          <Button variant="secondary" disabled={loading} onClick={() => void load()}>Yenile</Button>
        </div>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          POS ve depo stok kartları — SKU, birim maliyet ve kritik seviye uyarıları.
        </p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{stock.length} kart</span>
          <span className="roomio-badge">{lowStock.length} kritik seviye</span>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="ghost" href="/accounting?tab=stock">Muhasebe stok</Button>
          <Button variant="ghost" href="/settings?section=warehouse">Depo tanımları</Button>
          <Button variant="ghost" href="/settings/integrations/inventory">Stok entegrasyonu</Button>
        </div>
        {msg ? <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr><th>SKU</th><th>Ürün</th><th>Kategori</th><th>Birim</th><th>Miktar</th><th>Min</th><th>Maliyet</th><th /></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="roomio-table-empty">Yükleniyor…</td></tr>
            ) : stock.length === 0 ? (
              <tr><td colSpan={8} className="roomio-table-empty">Stok kartı yok.</td></tr>
            ) : stock.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.sku}</strong></td>
                <td>{s.name}</td>
                <td>{s.category}</td>
                <td>{s.unit}</td>
                <td className={s.qty <= s.minQty ? 'roomio-text-warn' : ''}>{s.qty}</td>
                <td>{s.minQty}</td>
                <td>{formatMoney(s.unitCost)}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <Button variant="ghost" onClick={() => void adjust(s.id, 'in')}>+</Button>
                  <Button variant="ghost" onClick={() => void adjust(s.id, 'out')}>−</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
