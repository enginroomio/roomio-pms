'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { formatMoney } from '@/lib/data/reservations';
import { useEffect, useState } from 'react';

type Invoice = { id: string; no: string; date: string; guest: string; amount: number; vat: number; status: string; type: string };
type StockItem = { id: string; sku: string; name: string; category: string; unit: string; qty: number; minQty: number; unitCost: number };
type LedgerEntry = { id: string; date: string; account: string; description: string; debit: number; credit: number; ref?: string };

export default function AccountingPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'invoices';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  function load() {
    void fetch('/api/auth/session')
      .then((r) => r.json())
      .then((j: { invoices?: Invoice[]; stock?: StockItem[]; ledger?: LedgerEntry[] }) => {
        setInvoices(j.invoices ?? []);
        setStock(j.stock ?? []);
        setLedger(j.ledger ?? []);
      });
  }

  useEffect(() => { load(); }, []);

  async function stockMove(id: string, type: 'in' | 'out') {
    await fetch('/api/inventory/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId: id, type, qty: 1 }),
    });
    load();
  }

  const tabs = [
    { id: 'invoices', label: 'Faturalar', href: '/accounting' },
    { id: 'ledger', label: 'Cari Defter', href: '/accounting?tab=ledger' },
    { id: 'stock', label: 'Stok', href: '/accounting?tab=stock' },
    { id: 'fiscal', label: 'Yazarkasa', href: '/accounting?tab=fiscal' },
  ];

  const total = invoices.reduce((s, i) => s + i.amount, 0);

  return (
    <ModuleLayout breadcrumb="ArkaBüro › Muhasebe" title="Muhasebe & ArkaBüro" description="Prisma DB — fatura, cari, stok." sideTitle="Muhasebe">
      <nav className="roomio-tabs">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} className={`roomio-tab${tab === t.id ? ' is-active' : ''}`}>{t.label}</Link>
        ))}
      </nav>

      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Fatura</span><strong className="roomio-kpi-value">{invoices.length}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Stok kalemi</span><strong className="roomio-kpi-value">{stock.length}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Cari hareket</span><strong className="roomio-kpi-value">{ledger.length}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">Fatura toplam</span><strong className="roomio-kpi-value">{formatMoney(total)}</strong></div>
      </div>

      {tab === 'invoices' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Fatura listesi</h2>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead><tr><th>No</th><th>Tarih</th><th>Misafir</th><th>Tip</th><th>Tutar</th><th>Durum</th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
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
      ) : null}

      {tab === 'ledger' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Cari defter hareketleri</h2>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead><tr><th>Tarih</th><th>Cari</th><th>Açıklama</th><th>Borç</th><th>Alacak</th><th>Ref</th></tr></thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td><strong>{e.account}</strong></td>
                  <td>{e.description}</td>
                  <td>{e.debit ? formatMoney(e.debit) : '—'}</td>
                  <td>{e.credit ? formatMoney(e.credit) : '—'}</td>
                  <td>{e.ref ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'stock' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Stok kartları</h2>
          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead><tr><th>SKU</th><th>Ad</th><th>Kategori</th><th>Miktar</th><th>Min</th><th>Birim maliyet</th><th /></tr></thead>
            <tbody>
              {stock.map((s) => (
                <tr key={s.id} className={s.qty <= s.minQty ? 'roomio-row-warn' : ''}>
                  <td><strong>{s.sku}</strong></td>
                  <td>{s.name}</td>
                  <td>{s.category}</td>
                  <td>{s.qty} {s.unit}</td>
                  <td>{s.minQty}</td>
                  <td>{formatMoney(s.unitCost)}</td>
                  <td>
                    <PermissionGate permission="accounting.write">
                      <Button variant="secondary" onClick={() => void stockMove(s.id, 'in')}>+1</Button>
                      {' '}
                      <Button variant="ghost" onClick={() => void stockMove(s.id, 'out')}>-1</Button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'fiscal' ? (
        <div className="roomio-card" style={{ marginTop: 16 }}>
          <h2 className="roomio-card-title">Yazarkasa kontrol paneli</h2>
          <div className="roomio-kpi-grid" style={{ marginTop: 12 }}>
            <div className="roomio-kpi"><span className="roomio-kpi-label">Z no</span><strong className="roomio-kpi-value">1247</strong></div>
            <div className="roomio-kpi"><span className="roomio-kpi-label">Bağlantı</span><strong className="roomio-kpi-value" style={{ color: 'var(--roomio-accent)' }}>OK</strong></div>
          </div>
        </div>
      ) : null}
    </ModuleLayout>
  );
}
