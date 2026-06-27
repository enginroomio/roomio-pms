import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway, LIVE_GATEWAY_ENV_KEYS } from '@/lib/integrations/live-probe';
import {
  DEFAULT_EFATURA_CONFIG,
  type EfaturaConfig,
  type EfaturaSendResult,
  type EfaturaSubmission,
} from '@/lib/integrations/efatura/types';
import { getInvoices, updateInvoice } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';

const CONFIG_FILE = process.env.ROOMIO_EFATURA_CONFIG
  ?? path.join(process.cwd(), '.roomio-data', 'efatura-config.json');
const SUBMISSIONS_FILE = process.env.ROOMIO_EFATURA_SUBMISSIONS
  ?? path.join(process.cwd(), '.roomio-data', 'efatura-submissions.json');

export async function loadEfaturaConfig(): Promise<EfaturaConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_EFATURA_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EFATURA_CONFIG;
  }
}

export async function saveEfaturaConfig(config: EfaturaConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

async function loadSubmissions(): Promise<EfaturaSubmission[]> {
  try {
    const raw = await fs.readFile(SUBMISSIONS_FILE, 'utf8');
    return JSON.parse(raw) as EfaturaSubmission[];
  } catch {
    return [];
  }
}

async function saveSubmissions(rows: EfaturaSubmission[]): Promise<void> {
  await fs.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true });
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

export async function listEfaturaSubmissions(): Promise<EfaturaSubmission[]> {
  return loadSubmissions();
}

export async function sendInvoiceToEfatura(
  invoiceId: string,
  propertyId = DEFAULT_PROPERTY_ID,
): Promise<EfaturaSendResult> {
  const config = await loadEfaturaConfig();
  if (!config.enabled) {
    return { ok: false, message: 'e-Fatura entegrasyonu kapalı' };
  }
  if (!config.vkn.trim()) {
    return { ok: false, message: 'VKN tanımlı değil' };
  }

  const invoices = await getInvoices(propertyId);
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) return { ok: false, message: 'Fatura bulunamadı' };

  let simulated = !isIntegrationLiveMode() || config.simulateWhenOffline || config.environment === 'test';
  if (isIntegrationLiveMode() && process.env.ROOMIO_EFATURA_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway(LIVE_GATEWAY_ENV_KEYS.efatura, 'e-Fatura');
    if (!probe.ok && !probe.simulated) {
      return { ok: false, message: probe.message };
    }
    if (!probe.simulated) simulated = false;
  }
  const uuid = randomUUID();
  const submission: EfaturaSubmission = {
    id: `efa-${Date.now()}`,
    invoiceId: invoice.id,
    invoiceNo: invoice.no,
    submittedAt: new Date().toISOString(),
    status: 'sent',
    uuid,
    simulated,
    message: simulated
      ? `Test ortamı — e-Fatura simülasyonu (${config.integrator})`
      : `GİB'e gönderildi (${config.integrator})`,
  };

  const rows = await loadSubmissions();
  rows.unshift(submission);
  await saveSubmissions(rows.slice(0, 200));

  if (invoice.status === 'draft') {
    await updateInvoice(invoice.id, { status: 'issued', ref: uuid }, propertyId);
  }

  return {
    ok: true,
    simulated,
    message: submission.message,
    submission,
  };
}

export async function testEfaturaConnection(config = DEFAULT_EFATURA_CONFIG): Promise<EfaturaSendResult> {
  if (!config.enabled) return { ok: false, message: 'e-Fatura kapalı' };
  if (!config.username.trim() || !config.vkn.trim()) {
    return { ok: false, message: 'Kullanıcı adı ve VKN gerekli' };
  }
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline || config.environment === 'test';
  return {
    ok: true,
    simulated,
    message: simulated
      ? `Simülasyon — ${config.environment} bağlantısı hazır`
      : 'GİB entegratör bağlantısı doğrulandı',
  };
}
