import type { CashEntry, FxExchange } from '@/lib/data/cash';

export type EodInvoiceRow = {
  id: string;
  no: string;
  date: string;
  guest: string;
  amount: number;
  status: string;
  type: string;
  companyName?: string;
};

export type EodStockRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  unitCost: number;
};

export type EodFinanceSnapshot = {
  businessDate: string;
  cashEntries: CashEntry[];
  invoices: EodInvoiceRow[];
  fxExchanges: FxExchange[];
  stockItems: EodStockRow[];
};
