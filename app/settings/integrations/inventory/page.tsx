'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_INVENTORY_CONFIG, type InventoryConfig, type InventorySyncResult } from '@/lib/integrations/inventory/types';

type InventorySummary = {
  ok: boolean;
  warehouseCount: number;
  itemCount: number;
  lowStockCount: number;
};

export default function InventorySettingsPage() {
  const [config, setConfig] = useState<InventoryConfig>(DEFAULT_INVENTORY_CONFIG);
  const [saved, setSaved] = useState(false);
  const [syncResult, setSyncResult] = useState<InventorySyncResult | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/inventory/config')
      .then((r) => r.json())
      .then((j: InventoryConfig) => setConfig({ ...DEFAULT_INVENTORY_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/inventory/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sync() {
    const res = await roomioFetch('/api/integrations/inventory/sync', { method: 'POST' });
    setSyncResult((await res.json()) as InventorySyncResult);
    const cfg = await roomioFetch('/api/integrations/inventory/config').then((r) => r.json());
    setConfig({ ...DEFAULT_INVENTORY_CONFIG, ...cfg });
  }

  async function loadSummary() {
    const res = await fetch('/api/integrations/inventory/summary');
    setSummary((await res.json()) as InventorySummary);
  }

  const lowStock = config.items.filter((i) => i.quantity <= i.minLevel);

  return (
    <PageHeader
      breadcrumb="Ayarlar > Stok & Envanter"
      title="Stok & Envanter"
      description="Depo, stok hareket ve maliyet — çoklu depo ve düşük stok uyarıları."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Stok">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoDeductOnSale} onChange={(e) => setConfig({ ...config, autoDeductOnSale: e.target.checked })} />
            <span>Satışta otomatik düşüm</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.trackRecipes} onChange={(e) => setConfig({ ...config, trackRecipes: e.target.checked })} />
            <span>Reçete takibi</span>
          </label>
        </FormGrid>
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          {config.items.length} stok kalemi · {config.warehouses.length} depo · {lowStock.length} düşük stok
        </p>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void sync()}>Stokları senkronize et</Button>
          <Button variant="secondary" onClick={() => void loadSummary()}>Özet görüntüle</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {syncResult ? <p className="roomio-page-desc">{syncResult.message}</p> : null}
        {summary ? (
          <p className="roomio-page-desc">
            API özeti: {summary.itemCount} kalem · {summary.warehouseCount} depo · {summary.lowStockCount} düşük stok
          </p>
        ) : null}
      </FormSection>
    </PageHeader>
  );
}
