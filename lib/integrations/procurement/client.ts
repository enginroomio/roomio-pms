import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  DEFAULT_PROCUREMENT_CONFIG,
  type ProcurementConfig,
  type PurchaseRequest,
} from '@/lib/integrations/procurement/types';

const CONFIG_FILE = 'procurement-config.json';
const REQUESTS_FILE = 'procurement-requests.json';

export async function loadProcurementConfig(): Promise<ProcurementConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_PROCUREMENT_CONFIG);
}

export async function saveProcurementConfig(config: ProcurementConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

async function loadRequests(): Promise<PurchaseRequest[]> {
  return loadJsonConfig(REQUESTS_FILE, [] as PurchaseRequest[]);
}

async function saveRequests(reqs: PurchaseRequest[]): Promise<void> {
  await saveJsonConfig(REQUESTS_FILE, reqs);
}

export async function createPurchaseRequest(input: {
  department: string;
  item: string;
  quantity: number;
  estimatedCost: number;
}) {
  const config = await loadProcurementConfig();
  if (!config.enabled) return { ok: false, message: 'Satın alma modülü kapalı' };

  const status: PurchaseRequest['status'] =
    input.estimatedCost <= config.approvalThreshold ? 'approved' : 'pending';

  const req: PurchaseRequest = {
    id: `pr-${Date.now()}`,
    department: input.department,
    item: input.item,
    quantity: input.quantity,
    estimatedCost: input.estimatedCost,
    status,
    createdAt: new Date().toISOString(),
  };

  const reqs = await loadRequests();
  reqs.push(req);
  await saveRequests(reqs);

  return {
    ok: true,
    message: status === 'approved'
      ? 'Talep otomatik onaylandı'
      : 'Talep onay bekliyor',
    request: req,
    autoRouteToSupplier: config.autoRouteToSupplier && status === 'approved',
  };
}

export async function listPurchaseRequests(): Promise<PurchaseRequest[]> {
  return loadRequests();
}
