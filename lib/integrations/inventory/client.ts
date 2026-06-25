import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import {
  DEFAULT_INVENTORY_CONFIG,
  type InventoryConfig,
  type InventorySyncResult,
} from '@/lib/integrations/inventory/types';

const FILE = 'inventory-config.json';

export async function loadInventoryConfig(): Promise<InventoryConfig> {
  return loadJsonConfig(FILE, DEFAULT_INVENTORY_CONFIG);
}

export async function saveInventoryConfig(config: InventoryConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function syncInventoryLevels(): Promise<InventorySyncResult> {
  const config = await loadInventoryConfig();
  if (!config.enabled) return { ok: false, message: 'Stok modülü kapalı', lowStockCount: 0 };

  const simulated = !isIntegrationLiveMode();
  const lowStock = config.items.filter((i) => i.quantity <= i.minLevel);
  return {
    ok: true,
    lowStockCount: lowStock.length,
    simulated,
    message: simulated
      ? `Simülasyon: ${lowStock.length} kalem minimum seviyede`
      : `${lowStock.length} kalem düşük stok uyarısı`,
  };
}

export async function getPublicInventorySummary() {
  const config = await loadInventoryConfig();
  const lowStock = config.items.filter((i) => i.quantity <= i.minLevel);
  return {
    ok: config.enabled,
    warehouseCount: config.warehouses.length,
    itemCount: config.items.length,
    lowStockCount: lowStock.length,
    lowStock: lowStock.map((i) => ({ sku: i.sku, name: i.name, quantity: i.quantity, minLevel: i.minLevel })),
  };
}
