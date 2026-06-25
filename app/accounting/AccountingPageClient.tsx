'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ModuleLayout } from '@/components/ModuleLayout';
import { Button } from '@/components/ui';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { roomioFetch } from '@/lib/client/api';
import { formatMoney } from '@/lib/data/reservations';
import { useI18n } from '@/components/i18n/I18nProvider';
import { AccountingFiscalPanel } from '@/components/accounting/AccountingFiscalPanel';
import { useCallback, useEffect, useState } from 'react';

type Invoice = {
  id: string;
  no: string;
  date: string;
  guest: string;
  amount: number;
  vat: number;
  status: string;
  type: string;
};
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
type LedgerEntry = {
  id: string;
  date: string;
  account: string;
  description: string;
  debit: number;
  credit: number;
  ref?: string;
};
type CompanyOption = { code: string; name: string };

const INVOICE_STATUS = ['draft', 'issued', 'paid'] as const;
const INVOICE_TYPES = ['konaklama', 'ekstra', 'banket'] as const;

export default function AccountingPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'invoices';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const [invGuest, setInvGuest] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invVat, setInvVat] = useState('20');
  const [invType, setInvType] = useState<(typeof INVOICE_TYPES)[number]>('konaklama');

  const [lgAccount, setLgAccount] = useState('');
  const [lgDesc, setLgDesc] = useState('');
  const [lgDebit, setLgDebit] = useState('');
  const [lgCredit, setLgCredit] = useState('');
  const [lgRef, setLgRef] = useState('');

  const load = useCallback(() => {
    void Promise.all([
      roomioFetch('/api/accounting/invoices').then((r) => r.json()),
      roomioFetch('/api/accounting/ledger').then((r) => r.json()),
      roomioFetch('/api/inventory/stock').then((r) => r.json()),
      roomioFetch('/api/companies').then((r) => r.json()),
    ]).then(([invJ, ledJ, stockJ, coJ]) => {
      setInvoices((invJ as { invoices?: Invoice[] }).invoices ?? []);
      setLedger((ledJ as { entries?: LedgerEntry[] }).entries ?? []);
      setStock((stockJ as { items?: StockItem[] }).items ?? []);
      setCompanies((coJ as { companies?: CompanyOption[] }).companies ?? []);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function stockMove(id: string, type: 'in' | 'out') {
    await roomioFetch('/api/inventory/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockId: id, type, qty: 1 }),
    });
    load();
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      guest: invGuest,
      amount: Number(invAmount),
      vat: Number(invVat),
      type: invType,
      status: 'draft' as const,
    };
    if (editingInvoiceId) {
      await roomioFetch('/api/accounting/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingInvoiceId, ...payload }),
      });
      setEditingInvoiceId(null);
    } else {
      await roomioFetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setInvGuest('');
    setInvAmount('');
    setShowInvoiceForm(false);
    load();
  }

  function startEditInvoice(inv: Invoice) {
    setEditingInvoiceId(inv.id);
    setInvGuest(inv.guest);
    setInvAmount(String(inv.amount));
    setInvVat(String(inv.vat));
    setInvType(inv.type as (typeof INVOICE_TYPES)[number]);
    setShowInvoiceForm(true);
  }

  async function markInvoiceIssued(id: string) {
    await roomioFetch('/api/accounting/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'issued' }),
    });
    load();
  }

  async function markInvoicePaid(id: string) {
    await roomioFetch('/api/accounting/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'paid' }),
    });
    load();
  }

  async function removeInvoice(id: string) {
    if (!window.confirm(t('accounting.deleteConfirm'))) return;
    await roomioFetch(`/api/accounting/invoices?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    load();
  }

  async function sendEfatura(invoiceId: string) {
    const res = await roomioFetch('/api/integrations/efatura/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    window.alert(j.message);
    load();
  }

  async function createLedger(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      account: lgAccount,
      description: lgDesc,
      debit: Number(lgDebit || 0),
      credit: Number(lgCredit || 0),
      ref: lgRef || undefined,
    };
    if (editingLedgerId) {
      await roomioFetch('/api/accounting/ledger', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLedgerId, ...payload }),
      });
      setEditingLedgerId(null);
    } else {
      await roomioFetch('/api/accounting/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setLgAccount('');
    setLgDesc('');
    setLgDebit('');
    setLgCredit('');
    setLgRef('');
    setShowLedgerForm(false);
    load();
  }

  function startEditLedger(entry: LedgerEntry) {
    setEditingLedgerId(entry.id);
    setLgAccount(entry.account);
    setLgDesc(entry.description);
    setLgDebit(entry.debit ? String(entry.debit) : '');
    setLgCredit(entry.credit ? String(entry.credit) : '');
    setLgRef(entry.ref ?? '');
    setShowLedgerForm(true);
  }

  async function removeLedger(id: string) {
    if (!window.confirm('Cari hareket silinsin mi?')) return;
    await roomioFetch(`/api/accounting/ledger?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    load();
  }

  const tabs = [
    { id: 'invoices', label: t('accounting.tab.invoices'), href: '/accounting' },
    { id: 'ledger', label: t('accounting.tab.ledger'), href: '/accounting?tab=ledger' },
    { id: 'stock', label: t('accounting.tab.stock'), href: '/accounting?tab=stock' },
    { id: 'fiscal', label: t('accounting.tab.fiscal'), href: '/accounting?tab=fiscal' },
  ];

  const total = invoices.reduce((s, i) => s + i.amount, 0);

  return (
    <ModuleLayout
      breadcrumb="ArkaBüro › Muhasebe"
      title={t('accounting.title')}
      description="Prisma DB — fatura, cari, stok CRUD."
      sideTitle={t('accounting.title')}
    >
      <nav className="roomio-tabs">
        {tabs.map((t) => (
          <Link key={t.id} href={t.href} className={`roomio-tab${tab === t.id ? ' is-active' : ''}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">{t('accounting.invoiceCount')}</span>
          <strong className="roomio-kpi-value">{invoices.length}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Stok kalemi</span>
          <strong className="roomio-kpi-value">{stock.length}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Cari hareket</span>
          <strong className="roomio-kpi-value">{ledger.length}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">{t('accounting.invoiceTotal')}</span>
          <strong className="roomio-kpi-value">{formatMoney(total)}</strong>
        </div>
      </div>

      {tab === 'invoices' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <div className="roomio-card-head-row">
            <h2 className="roomio-card-title">{t('accounting.invoiceList')}</h2>
            <PermissionGate permission="accounting.write">
              <Button variant="secondary" onClick={() => { setEditingInvoiceId(null); setShowInvoiceForm((v) => !v); }}>
                {showInvoiceForm ? 'İptal' : 'Yeni fatura'}
              </Button>
            </PermissionGate>
          </div>

          {showInvoiceForm ? (
            <form className="roomio-form roomio-form--inline" onSubmit={(e) => void createInvoice(e)}>
              <label className="roomio-field">
                <span>Misafir / Cari</span>
                <input
                  className="roomio-input"
                  list="accounting-cari-list"
                  value={invGuest}
                  onChange={(e) => setInvGuest(e.target.value)}
                  required
                />
                <datalist id="accounting-cari-list">
                  {companies.map((c) => (
                    <option key={c.code} value={`${c.code} — ${c.name}`} />
                  ))}
                </datalist>
              </label>
              <label className="roomio-field">
                <span>Tutar (₺)</span>
                <input className="roomio-input" type="number" min="0" step="0.01" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} required />
              </label>
              <label className="roomio-field">
                <span>KDV %</span>
                <input className="roomio-input" type="number" min="0" value={invVat} onChange={(e) => setInvVat(e.target.value)} />
              </label>
              <label className="roomio-field">
                <span>Tip</span>
                <select className="roomio-select" value={invType} onChange={(e) => setInvType(e.target.value as (typeof INVOICE_TYPES)[number])}>
                  {INVOICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <Button type="submit">{editingInvoiceId ? 'Güncelle' : 'Kaydet'}</Button>
            </form>
          ) : null}

          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>No</th>
                <th>Tarih</th>
                <th>Misafir</th>
                <th>Tip</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.no}</strong></td>
                  <td>{inv.date}</td>
                  <td>{inv.guest}</td>
                  <td>{inv.type}</td>
                  <td>{formatMoney(inv.amount)}</td>
                  <td><span className="roomio-badge">{inv.status}</span></td>
                  <td>
                    <Button
                      variant="ghost"
                      href={`/api/accounting/invoices?id=${encodeURIComponent(inv.id)}&format=pdf`}
                    >
                      {t('accounting.downloadPdf')}
                    </Button>
                    {' '}
                    <PermissionGate permission="accounting.write">
                      {inv.status === 'draft' ? (
                        <Button variant="ghost" onClick={() => void markInvoiceIssued(inv.id)}>{t('accounting.issue')}</Button>
                      ) : null}
                      {inv.status !== 'paid' ? (
                        <Button variant="ghost" onClick={() => void markInvoicePaid(inv.id)}>{t('accounting.collect')}</Button>
                      ) : null}
                      {' '}
                      <Button variant="ghost" onClick={() => void sendEfatura(inv.id)}>e-Fatura</Button>
                      {' '}
                      <Button variant="ghost" onClick={() => startEditInvoice(inv)}>{t('accounting.edit')}</Button>
                      {' '}
                      <Button variant="ghost" onClick={() => void removeInvoice(inv.id)}>{t('accounting.delete')}</Button>
                    </PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'ledger' ? (
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <div className="roomio-card-head-row">
            <h2 className="roomio-card-title">Cari defter hareketleri</h2>
            <PermissionGate permission="accounting.write">
              <Button variant="secondary" onClick={() => { setEditingLedgerId(null); setShowLedgerForm((v) => !v); }}>
                {showLedgerForm ? 'İptal' : 'Yeni hareket'}
              </Button>
            </PermissionGate>
          </div>

          {showLedgerForm ? (
            <form className="roomio-form roomio-form--inline" onSubmit={(e) => void createLedger(e)}>
              <label className="roomio-field">
                <span>Cari hesap</span>
                <input className="roomio-input" value={lgAccount} onChange={(e) => setLgAccount(e.target.value)} required />
              </label>
              <label className="roomio-field">
                <span>Açıklama</span>
                <input className="roomio-input" value={lgDesc} onChange={(e) => setLgDesc(e.target.value)} required />
              </label>
              <label className="roomio-field">
                <span>Borç</span>
                <input className="roomio-input" type="number" min="0" step="0.01" value={lgDebit} onChange={(e) => setLgDebit(e.target.value)} />
              </label>
              <label className="roomio-field">
                <span>Alacak</span>
                <input className="roomio-input" type="number" min="0" step="0.01" value={lgCredit} onChange={(e) => setLgCredit(e.target.value)} />
              </label>
              <label className="roomio-field">
                <span>Ref</span>
                <input className="roomio-input" value={lgRef} onChange={(e) => setLgRef(e.target.value)} />
              </label>
              <Button type="submit">{editingLedgerId ? 'Güncelle' : 'Kaydet'}</Button>
            </form>
          ) : null}

          <table className="roomio-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Cari</th>
                <th>Açıklama</th>
                <th>Borç</th>
                <th>Alacak</th>
                <th>Ref</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td><strong>{e.account}</strong></td>
                  <td>{e.description}</td>
                  <td>{e.debit ? formatMoney(e.debit) : '—'}</td>
                  <td>{e.credit ? formatMoney(e.credit) : '—'}</td>
                  <td>{e.ref ?? '—'}</td>
                  <td>
                    <PermissionGate permission="accounting.write">
                      <Button variant="ghost" onClick={() => startEditLedger(e)}>Düzenle</Button>
                      {' '}
                      <Button variant="ghost" onClick={() => void removeLedger(e.id)}>Sil</Button>
                    </PermissionGate>
                  </td>
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
            <thead>
              <tr>
                <th>SKU</th>
                <th>Ad</th>
                <th>Kategori</th>
                <th>Miktar</th>
                <th>Min</th>
                <th>Birim maliyet</th>
                <th />
              </tr>
            </thead>
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

      {tab === 'fiscal' ? <AccountingFiscalPanel /> : null}
    </ModuleLayout>
  );
}
