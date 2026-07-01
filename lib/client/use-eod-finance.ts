'use client';

import { useCallback, useEffect, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import type { CashEntry, FxExchange } from '@/lib/data/cash';
import type { EodFinanceSnapshot, EodInvoiceRow, EodStockRow } from '@/lib/reports/eod-finance-types';

export function useEodFinanceSnapshot(businessDate: string) {
  const { propertyId } = useProperty();
  const [snapshot, setSnapshot] = useState<EodFinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!businessDate?.trim()) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    try {
      const cashQs = new URLSearchParams({ businessDate });
      const fxQs = new URLSearchParams({ businessDate });
      const [cashRes, invRes, fxRes, stockRes] = await Promise.all([
        roomioFetch(`/api/cash?${cashQs}`, { cache: 'no-store' }),
        roomioFetch('/api/accounting/invoices', { cache: 'no-store' }),
        roomioFetch(`/api/fx-exchanges?${fxQs}`, { cache: 'no-store' }),
        roomioFetch('/api/inventory/stock', { cache: 'no-store' }),
      ]);

      const cashJson = cashRes.ok
        ? ((await cashRes.json()) as { entries?: CashEntry[]; businessDate?: string })
        : { entries: [] as CashEntry[] };
      const invJson = invRes.ok
        ? ((await invRes.json()) as { invoices?: EodInvoiceRow[] })
        : { invoices: [] as EodInvoiceRow[] };
      const fxJson = fxRes.ok
        ? ((await fxRes.json()) as { exchanges?: FxExchange[] })
        : { exchanges: [] as FxExchange[] };
      const stockJson = stockRes.ok
        ? ((await stockRes.json()) as { items?: EodStockRow[] })
        : { items: [] as EodStockRow[] };

      setSnapshot({
        businessDate: cashJson.businessDate ?? businessDate,
        cashEntries: cashJson.entries ?? [],
        invoices: invJson.invoices ?? [],
        fxExchanges: fxJson.exchanges ?? [],
        stockItems: stockJson.items ?? [],
      });
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [businessDate]);

  useEffect(() => {
    void reload();
  }, [reload, propertyId]);

  return { snapshot, loading, reload };
}
