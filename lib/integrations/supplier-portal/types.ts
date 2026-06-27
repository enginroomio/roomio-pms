export type Supplier = {
  id: string;
  name: string;
  category: string;
  contactEmail: string;
  enabled: boolean;
};

export type SupplierPortalConfig = {
  enabled: boolean;
  autoApproveOrders: boolean;
  notifyOnLowStock: boolean;
  suppliers: Supplier[];
  simulateWhenOffline: boolean;
};

export const DEFAULT_SUPPLIER_PORTAL_CONFIG: SupplierPortalConfig = {
  enabled: true,
  autoApproveOrders: false,
  notifyOnLowStock: true,
  simulateWhenOffline: true,
  suppliers: [
    { id: 's1', name: 'Metro Gıda', category: 'F&B', contactEmail: 'siparis@metro.test', enabled: true },
    { id: 's2', name: 'Linens Co', category: 'Tekstil', contactEmail: 'orders@linens.test', enabled: true },
    { id: 's3', name: 'CleanPro', category: 'Temizlik', contactEmail: 'info@cleanpro.test', enabled: true },
  ],
};

export type SupplierOrderResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  simulated?: boolean;
};
