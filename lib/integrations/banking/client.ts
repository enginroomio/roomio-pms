import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { DEFAULT_BANKING_CONFIG, type BankingConfig, type BankingSyncResult } from '@/lib/integrations/banking/types';

const FILE = 'banking-config.json';

export async function loadBankingConfig(): Promise<BankingConfig> {
  return loadJsonConfig(FILE, DEFAULT_BANKING_CONFIG);
}

export async function saveBankingConfig(config: BankingConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function syncBankingBalances(config = DEFAULT_BANKING_CONFIG): Promise<BankingSyncResult> {
  if (!config.enabled) return { ok: false, message: 'Banka entegrasyonu kapalı', updatedAccounts: 0 };
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  const updated = config.accounts.map((a, i) => ({
    ...a,
    balance: a.balance + (simulated ? (i + 1) * 1250 : 0),
  }));
  await saveBankingConfig({ ...config, accounts: updated });
  return {
    ok: true,
    updatedAccounts: updated.length,
    simulated,
    message: simulated
      ? `Simülasyon: ${updated.length} hesap bakiyesi güncellendi`
      : `${updated.length} hesap senkronize edildi`,
  };
}
