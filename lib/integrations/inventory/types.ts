export type StockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLevel: number;
  cost: number;
  currency: string;
};

export type InventoryConfig = {
  enabled: boolean;
  autoDeductOnSale: boolean;
  trackRecipes: boolean;
  warehouses: string[];
  items: StockItem[];
};

export const DEFAULT_INVENTORY_CONFIG: InventoryConfig = {
  enabled: true,
  autoDeductOnSale: true,
  trackRecipes: true,
  warehouses: ['Ana Depo', 'Mutfak', 'Bar', 'HK'],
  items: [
    { id: '1', sku: 'FB-001', name: 'Zeytinyağı 5L', category: 'Mutfak', unit: 'adet', quantity: 24, minLevel: 10, cost: 450, currency: 'TRY' },
    { id: '2', sku: 'FB-002', name: 'Kahve çekirdeği', category: 'Mutfak', unit: 'kg', quantity: 18, minLevel: 8, cost: 320, currency: 'TRY' },
    { id: '3', sku: 'HK-001', name: 'Şampuan 30ml', category: 'HK', unit: 'adet', quantity: 500, minLevel: 200, cost: 4.5, currency: 'TRY' },
    { id: '4', sku: 'BR-001', name: 'Bira fıçısı 50L', category: 'Bar', unit: 'adet', quantity: 6, minLevel: 3, cost: 2800, currency: 'TRY' },
  ],
};

export type InventorySyncResult = {
  ok: boolean;
  message: string;
  lowStockCount: number;
  simulated?: boolean;
};
