'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_SUPPLIER_PORTAL_CONFIG, type SupplierOrderResult, type SupplierPortalConfig } from '@/lib/integrations/supplier-portal/types';

export default function SupplierPortalSettingsPage() {
  const [config, setConfig] = useState<SupplierPortalConfig>(DEFAULT_SUPPLIER_PORTAL_CONFIG);
  const [saved, setSaved] = useState(false);
  const [orderResult, setOrderResult] = useState<SupplierOrderResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/supplier-portal/config')
      .then((r) => r.json())
      .then((j: SupplierPortalConfig) => setConfig({ ...DEFAULT_SUPPLIER_PORTAL_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/supplier-portal/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function demoOrder() {
    const supplier = config.suppliers.find((s) => s.enabled);
    if (!supplier) {
      setOrderResult({ ok: false, message: 'Aktif tedarikçi yok' });
      return;
    }
    const res = await roomioFetch('/api/integrations/supplier-portal/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId: supplier.id, item: 'Demo ürün', quantity: 5 }),
    });
    setOrderResult((await res.json()) as SupplierOrderResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Tedarikçi Portalı"
      title="Tedarikçi Portalı"
      description="Tedarikçi siparişleri, onay akışı ve düşük stok bildirimleri — ElektraWeb tedarik modülü."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Genel">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoApproveOrders} onChange={(e) => setConfig({ ...config, autoApproveOrders: e.target.checked })} />
            <span>Siparişleri otomatik onayla</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.notifyOnLowStock} onChange={(e) => setConfig({ ...config, notifyOnLowStock: e.target.checked })} />
            <span>Düşük stok bildirimi</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
        </FormGrid>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Tedarikçi</th><th>Kategori</th><th>E-posta</th><th>Durum</th></tr></thead>
            <tbody>
              {config.suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.category}</td>
                  <td>{s.contactEmail}</td>
                  <td>{s.enabled ? 'Aktif' : 'Kapalı'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void demoOrder()}>Demo sipariş gönder</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {orderResult ? <p className="roomio-page-desc">{orderResult.message}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>{config.suppliers.filter((s) => s.enabled).length} aktif tedarikçi</p>
      </FormSection>
    </PageHeader>
  );
}
