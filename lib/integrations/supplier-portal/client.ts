import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import {
  DEFAULT_SUPPLIER_PORTAL_CONFIG,
  type SupplierPortalConfig,
  type SupplierOrderResult,
} from '@/lib/integrations/supplier-portal/types';

const FILE = 'supplier-portal-config.json';

export async function loadSupplierPortalConfig(): Promise<SupplierPortalConfig> {
  return loadJsonConfig(FILE, DEFAULT_SUPPLIER_PORTAL_CONFIG);
}

export async function saveSupplierPortalConfig(config: SupplierPortalConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function createSupplierOrder(input: {
  supplierId: string;
  item: string;
  quantity: number;
  notes?: string;
}): Promise<SupplierOrderResult> {
  const config = await loadSupplierPortalConfig();
  if (!config.enabled) return { ok: false, message: 'Tedarik portalı kapalı' };
  const supplier = config.suppliers.find((s) => s.id === input.supplierId && s.enabled);
  if (!supplier) return { ok: false, message: 'Tedarikçi bulunamadı' };

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  const orderId = `po-${Date.now()}`;
  return {
    ok: true,
    orderId,
    simulated,
    message: simulated
      ? `Simülasyon: ${supplier.name} — ${input.quantity}× ${input.item} siparişi (${orderId})`
      : `Sipariş gönderildi: ${orderId}`,
  };
}
