export type PurchaseRequest = {
  id: string;
  department: string;
  item: string;
  quantity: number;
  estimatedCost: number;
  status: 'pending' | 'approved' | 'ordered' | 'rejected';
  createdAt: string;
};

export type ProcurementConfig = {
  enabled: boolean;
  approvalThreshold: number;
  currency: string;
  autoRouteToSupplier: boolean;
  departments: string[];
};

export const DEFAULT_PROCUREMENT_CONFIG: ProcurementConfig = {
  enabled: true,
  approvalThreshold: 5000,
  currency: 'TRY',
  autoRouteToSupplier: true,
  departments: ['Mutfak', 'Bar', 'HK', 'Teknik', 'Ön Büro', 'SPA'],
};
